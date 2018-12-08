import 'mocha';
import { expect } from 'chai';
import {Encode} from "../../../../src/common/dataspace/Encode";
import {DataSpaceServer} from "../../../../src/node/server/DataSpaceServer";
import {Client} from "../../../../src/common/dataspace/Client";
import {createTestIdToken, resetStorage, startTestServer} from "../../util/util";
import {w3cwebsocket} from "websocket";
import {parseFragment} from "../../../../src/node/util/parser";

describe('Test Messaging', () => {
    let server: DataSpaceServer;
    let client = new Client("test", "ws://127.0.0.1:8889/", "http://localhost:8889/api", "http://localhost:8889/repository", createTestIdToken());

    before(async () => {
        server = await startTestServer();
        client.newWebSocket = (url:string, protocol:string) => { return new w3cwebsocket(url, protocol) as any};
        await client.connect();
    });

    after(function() {
        client.close();
        server.close();
    });

    beforeEach(async () => {
        resetStorage(server);
    });

    it('Should save entity.', function (done) {
        client.add("1", 1, 2, 3, 4, 5, 6, 7, '<a-image src="dog.img"/>', Encode.AVATAR);
        client.onReceive = async function (message) {
            expect(message).equals('a|0|1|1.00|2.00|3.00|4.00|5.00|6.00|7.00|<a-image src="dog.img"/>|a|');
            client.saveEntities("<a-entities><a-box>test</a-box></a-entities>");
            client.onStoredEntitiesChanged = (sids, entitiesXml) => {
                const entitiesFragment = parseFragment(entitiesXml);
                expect(sids.length).eq(1);
                expect(entitiesFragment.elements.length).eq(1);

                client.removeEntities(entitiesXml);
                client.onStoredEntitiesChanged = (sids2, entitiesXml2) => {
                    const entitiesFragment2 = parseFragment(entitiesXml2);
                    expect(sids2.length).eq(1);
                    expect(entitiesFragment2.elements.length).eq(0);
                    done();
                }
            };
        }
    });

});