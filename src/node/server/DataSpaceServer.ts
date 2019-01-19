import * as websocket from "websocket";
import * as http from "http";
import {Processor} from "../processor/Processor";
import {Connection} from "../processor/Connection";
import uuid = require("uuid");
import {StorageApi} from "../api/StorageApi";
import {IdTokenIssuer} from "../../common/dataspace/Configuration";
import {Context} from "../framework/http/Context";
import {endResponseWithError, processRequest} from "../framework/http/http";
import {Decode, Encode} from "../..";
import {decodeIdToken, validateIdToken} from "../../common/util/jwt";
import {info, warnWithRequestId} from "../util/log";
import {Principal} from "../framework/rest/Principal";
import {log} from "util";
import {connection} from "websocket";

export class DataSpaceServer {

    host: string;
    port: number;
    processor: Processor | undefined;
    storageApi: StorageApi | undefined;
    webSocketServer: websocket.server = undefined as any as websocket.server;

    httpServer: http.Server = undefined as any as http.Server;
    issuers: Map<string, IdTokenIssuer> = new Map<string, IdTokenIssuer>();

    constructor(host: string, port: number, processor: Processor | undefined, storageApi: StorageApi | undefined, idTokenIssuers: Array<IdTokenIssuer>) {
        this.host = host;
        this.port = port;
        this.processor = processor;
        this.storageApi = storageApi;
        idTokenIssuers.forEach(idTokenIssuer => {
            this.issuers.set(idTokenIssuer.issuer, idTokenIssuer);
        })
    }

    async startup() {
        this.httpServer = http.createServer(async (request, response) => {
            if (this.storageApi) {
                await processRequest(request, response, [
                    async (c: Context) => this.storageApi!!.process(c)
                ], this.issuers);
            } else {
                await processRequest(request, response, [], this.issuers);
            }
        });


        if (this.storageApi) {
            await this.storageApi.startup();
        }

        if (this.processor) {
            console.log('dataspace server - started processor.')
            this.webSocketServer = new websocket.server({httpServer: this.httpServer});
            this.webSocketServer.on('request', (request) => this.processConnection(request));
            this.processor.start();
        }

        this.httpServer.listen(this.port, this.host);

        if (this.processor) {
            console.log('dataspace server - processor listening at local URL: at ws://' + this.host + ':' + this.port + '/');
        }
        if (this.storageApi) {
            console.log('dataspace server - storage listening at local URL: http://' + this.host + ':' + this.port + '/api');
        }

    }

    async close() {
        if (this.processor) {
            this.processor.stop();
            this.webSocketServer.shutDown();
        }
        if (this.storageApi) {
            await this.storageApi.shutdown();
        }
        this.httpServer.close();
        console.log('dataspace server - closed.');
    }

    processConnection(request: websocket.request) {
        console.log('dataspace server - client connected from ' + request.socket.remoteAddress + ':' + request.socket.remotePort);
        const ws = request.accept('ds-v1.0', request.origin);

        const connection = new Connection(uuid.v4());
        this.processor!!.add(connection);
        connection.send = async (message) => {
            ws.send(message);
        };
        ws.on('message', async (message: websocket.IMessage) => {
            if (message.utf8Data!!) {
                if (message.utf8Data!!.startsWith(Encode.LOGIN + '|')) {
                    await this.processLoginRequest(ws, message.utf8Data!!);
                } else {
                    await connection.receive(message.utf8Data!!);
                }
            } else {
                console.warn('dataspace server - client message from ' + request.socket.remoteAddress + ':' + request.socket.remotePort + ' without utf8Data.');
            }
        });
        ws.on('close', () => {
            console.log('dataspace server - client disconnected from ' + request.socket.remoteAddress + ':' + request.socket.remotePort);
            this.processor!!.remove(connection);
        });
    }

    private async processLoginRequest(ws: connection, message: string) {
        try {
            const parts = message.split(Encode.SEPARATOR);
            const m = Decode.login(parts);
            const loginRequestId = m[0];
            const idToken = m[1];
            const dimensionName = m[2];
            const processorName = m[3];

            if (!loginRequestId) {
                await this.processLoginError(ws, "", "no login request id in login request");
                return;
            }
            if (!idToken) {
                await this.processLoginError(ws, loginRequestId, "no id token in login request");
                return;
            }
            if (!dimensionName) {
                await this.processLoginError(ws, loginRequestId, "no dimension name in login request");
                return;
            }
            if (!dimensionName) {
                await this.processLoginError(ws, loginRequestId, "no processor name name in login request");
                return;
            }

            const issuer = decodeIdToken(idToken).get("iss") as string;
            if (!issuer) {
                await this.processLoginError(ws, loginRequestId, "jwt issuer claim not found in jwt");
                return;
            }

            const idTokenIssuer = this.issuers.get(issuer!! as string)!!;
            if (!idTokenIssuer) {
                await this.processLoginError(ws, loginRequestId, "jwt issuer not found: " + issuer);
                return;
            }

            const claims = validateIdToken(idToken, idTokenIssuer.publicKey);
            if (!claims.has("id") || !claims.has("exp") || !claims.has("name") || !claims.get("jti")) {
                await this.processLoginError(ws, loginRequestId, "jwt missing mandatory claims.");
                return;
            }

            const groupsString = claims.get("groups");
            const groups = groupsString ? groupsString.split(",") : undefined;
            const principal = new Principal(issuer, claims.get("jti") as string, loginRequestId, claims.get("id")!! as string, claims.get("name")!! as string, groups);

            info(principal, "client login success " + dimensionName + "/" + processorName);
            await ws.send(Encode.loginResponse(loginRequestId, ""));

        } catch (error) {
            await this.processLoginError(ws, "", "jwt missing mandatory claims.");
        }
    }

    private async processLoginError(ws: websocket.connection, loginRequestId: string, errorMessage: string) {
        await ws.send(Encode.loginResponse(loginRequestId, errorMessage));
        console.warn("dataspace server - login request failed " + loginRequestId + " : " + errorMessage);
        ws.close();
    }
}