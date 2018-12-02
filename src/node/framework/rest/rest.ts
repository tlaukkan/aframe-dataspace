import {RestApiContext} from "./RestApiContext";
import {error, info} from "../../util/log";

const CACHE_REGEXP = new Map<string, RegExp>();
const CACHE_REGEXP_WITH_GLOBAL_FLAG = new Map<string, RegExp>();

export class Processors {
    GET: undefined | ((requestContext: RestApiContext) => Promise<any>) = undefined;
    POST: undefined | ((requestContext: RestApiContext) => Promise<any>) = undefined;
    PUT: undefined | ((requestContext: RestApiContext) => Promise<any>) = undefined;
    DELETE: undefined | ((requestContext: RestApiContext) => Promise<any>) = undefined;

    constructor(GET: ((requestContext: RestApiContext) => Promise<any>) | undefined = undefined, POST: ((requestContext: RestApiContext) => Promise<any>) | undefined = undefined, PUT: ((requestContext: RestApiContext) => Promise<any>) | undefined = undefined, DELETE: ((requestContext: RestApiContext) => Promise<any>) | undefined = undefined) {
        this.GET = GET;
        this.POST = POST;
        this.PUT = PUT;
        this.DELETE = DELETE;
    }
}

export async function match(context: RestApiContext,
                            urlPattern: string,
                            processors: Processors): Promise<RestApiContext> {
    if (context.processed) {
        return context;
    }

    const pathParamNames = matchPatternGlobal(urlPattern, '\\{([a-zA-Z]*)\\}');
    const urlRegExpPattern = pathParamNames && pathParamNames.length > 0 ? pathParamNames.reduce(function(u, p) {
        return u.replace(p, "([a-zA-Z0-9-]*)");
    }, urlPattern) : urlPattern;


    const pathParamValues = matchPattern(context.request.url!!, "^" + urlRegExpPattern + "$");

    if (pathParamValues === undefined) {
        // No URL match.
        return context;
    }

    const parameters = pathParamNames ? pathParamNames!!.reduce(function(map: Map<string, string>, idName: string, i: number) {
        return new Map<string, string>(map).set(idName.substring(1, idName.length - 1), pathParamValues[i]);
    }, new Map<string, string>()) : new Map<string, string>();

    const updatedContext = new RestApiContext(context.principal, context.request, context.response, true, parameters, undefined);

    const processor = (processors as any)[context.request.method!!] as (requestContext: RestApiContext) => Promise<void>;

    if (!processor) {
        // Matching url pattern found but no processor implementation defined.
        endResponse(context, 405);
        return updatedContext;
    }

    try {
        await processRequest(updatedContext, processor);
    } catch (err) {
        endResponseWithError(context, err, 500);
    }

    return updatedContext;
}

export function processRequest(context: RestApiContext, processor: ((requestContext: RestApiContext) => Promise<any>)) {
    const body = Array<Uint8Array>();
    context.request.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', async () => {
        await onRequestEnd(body, processor, context);
    }).on('error', (err) => {
        endResponseWithError(context, err, 500);
    });
}

async function onRequestEnd(body: Array<Uint8Array>, processor: (requestContext: RestApiContext) => Promise<any>, context: RestApiContext) {
    try {
        const requestBodyJson = Buffer.concat(body).toString();
        if (requestBodyJson) {
            const requestBodyObj = JSON.parse(requestBodyJson);
            const responseBody = await processor({...context, body: requestBodyObj});
            if (responseBody) {
                context.response.write(JSON.stringify(responseBody));
                endResponse(context, 200);
            } else {
                if (context.request.method === "DELETE") {
                    endResponse(context, 200);
                } else {
                    endResponse(context, 404);
                }
            }
        } else {
            const responseBody = await processor(context);
            if (responseBody) {
                context.response.write(JSON.stringify(responseBody));
                endResponse(context, 200);
            } else {
                if (context.request.method === "DELETE") {
                    endResponse(context, 200);
                } else {
                    endResponse(context, 404);
                }
            }
        }
    } catch (err) {
        endResponseWithError(context, err, 500);
    }
}

function endResponse(context: RestApiContext, httpStatusCode: number) {
    info(context.principal, httpStatusCode.toString() + " " + context.request.method + ": " + context.request.url + " ");
    context.response.writeHead(httpStatusCode, {'Content-Type': 'text/plain'});
    context.response.end();
}

function endResponseWithError(context: RestApiContext, err: Error, httpStatusCode: number) {
    error(context.principal, httpStatusCode.toString() + " " + context.request.method + ": " + context.request.url + " ", err);
    context.response.writeHead(httpStatusCode, {'Content-Type': 'text/plain'});
    context.response.end();
}

function matchPatternGlobal(str: string, pattern: string) {
    let match = str!!.match(buildRegExpWithGlobalFlag(pattern));
    if (match != null) {
        return Array.from(match);
    }
    return undefined;
}

function matchPattern(str: string, pattern: string) {
    let match = str!!.match(buildRegExp(pattern));
    if (match != null) {
        return Array.from(match).splice(1);
    }
    return undefined;
}

function buildRegExp(pattern: string): RegExp {
    if (!CACHE_REGEXP.has(pattern)) {
        CACHE_REGEXP.set(pattern, new RegExp(pattern));
    }
    return CACHE_REGEXP.get(pattern)!!;
}


function buildRegExpWithGlobalFlag(pattern: string): RegExp {
    if (!CACHE_REGEXP_WITH_GLOBAL_FLAG.has(pattern)) {
        CACHE_REGEXP_WITH_GLOBAL_FLAG.set(pattern, new RegExp(pattern, "g"));
    }
    return CACHE_REGEXP_WITH_GLOBAL_FLAG.get(pattern)!!;
}
