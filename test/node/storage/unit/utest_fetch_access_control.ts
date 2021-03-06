import 'mocha';
import {expect} from 'chai';
import {RealityServer} from "../../../../src/node/server/RealityServer";
import {createTestIdToken, resetStorage, startLocalTestServer} from "../../util/util";
import uuid = require("uuid");

describe('Storage API / Testing access control ...', () => {
    let server: RealityServer;
    const idToken = createTestIdToken();

    before(async () => {
        server = await startLocalTestServer();
    });

    beforeEach(async () => {
        resetStorage(server);
    });

    after(async () => {
        await server.close();
    });

    it('It should test health check.', async () => {
        const response = await fetch("http://127.0.0.1:8889/health");
        expect(response.status).equals(200);
    });

    it('It should call API without request ID header and authorization header and return 401.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/spaces/default/regions/test/users", { headers: { } });
        expect(response.status).equals(401);
    });

    it('It should call API without request ID header and return 401.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/spaces/default/regions/test/users", { headers: { "Authorization": "Bearer " + idToken } });
        expect(response.status).equals(401);
    });

    it('It should call API without authorization header and return 401.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/spaces/default/regions/test/users", { headers: { "Request-ID": uuid.v4() } });
        expect(response.status).equals(401);
    });

    it('It should call API without Bearer in authorization header return 401.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/spaces/default/regions/test/users", { headers: { "Authorization": "s", "Request-ID": uuid.v4()}});
        expect(response.status).equals(401);
    });

    it('It should call API without correctly formatted token in authorization header return 401.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/spaces/default/regions/test/users", { headers: { "Authorization": "Bearer doh", "Request-ID": uuid.v4()}});
        expect(response.status).equals(401);
    });

    it('It should call API with non existent URL path and return 404.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/spaces/default/regions/test/non-existent", { headers: { "Authorization": "Bearer " + idToken, "Request-ID": uuid.v4()}});
        expect(response.status).equals(404);
    });

    it('It should call API with unsupported method and return 405.', async () => {
        const response = await fetch("http://127.0.0.1:8889/api/spaces/default/regions/test/users", { method: 'PUT', headers: { "Authorization": "Bearer " + idToken, "Request-ID": uuid.v4() }});
        expect(response.status).equals(405);
    });

});