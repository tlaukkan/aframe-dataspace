import {FileContent} from "../../src/node/storage/model/FileContent";

export function createTestIdToken(): string {
    return "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0LWlzc3VlciIsImlkIjoidW5pdC10ZXN0LWFkbWluaXN0cmF0b3IiLCJqdGkiOiI4ZGYwODA0Yi1jMjQ4LTQ2YjgtYjEwYy00ZDYwMWVjMTNkNmUiLCJuYW1lIjoidW5pdC10ZXN0LWFkbWluaXN0cmF0b3IiLCJncm91cHMiOiJhZG1pbmlzdHJhdG9ycyIsImV4cCI6MTU3OTQ2OTQwNywiaWF0IjoxNTQ3OTMzNDA3fQ.hgB1yT99vFflqzsNd0of0edTVqlXzrO4ATvmP2ufcMVJNOddW3GMNoFsy4TWd0Q0YGfo5kJd6iewjORKhhWEuLh0F2cvi-VyPZe6KlViHnpnl8c8aj0weF4jjiCeDYE3Dy0ZfB8PjDVYSQzU1QhG9WPBHQ8ZG5iwPO4LRbhZX1rj8fA0zsR03mr7NDrUtfQjW90T0Rark83ZtoQrwfSIGVAC0hHk0Kn8LbfHKcutpe1r7JmO2cTell3w08tVp_eBUvu9RElrRXEo6Q6TedglJlgQfMfzkYum-NyIj_OYrEeoclAVVV_X1myXDlqwxUH8Qk4K_tWoVq3otqbWxe2AXw";
}

export function streamToString(readableStream: ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            let loadedText = '';
            const decoder = new TextDecoder("utf-8");
            console.log(JSON.stringify(readableStream, null, 2));
            readableStream.getReader().read().then((data: any) => {
                try {
                    if (data.done) {
                        resolve(loadedText);
                    }
                    loadedText += decoder.decode(data.value);
                    console.log("received: " + JSON.stringify(data));
                } catch (error) {
                    reject(error);
                }
            });
            /*(readableStream as any).on('data', function (chunk: any) {
                loadedText += decoder.decode(chunk);
            });
            (readableStream as any).on('end', function (chunk: any) {
                if (chunk) {
                    loadedText += decoder.decode(chunk);
                }
                resolve(loadedText);
            });*/
        } catch (error) {
            reject(error);
        }
    });
}

export function stringToStream(testText: string) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(encoder.encode(testText))
        }
    });
    return stream;
}