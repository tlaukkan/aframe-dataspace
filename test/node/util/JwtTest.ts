import 'mocha';
import {createIdToken, decodeIdToken, validateIdToken} from "../../../src/node/util/jwt";
const { generateKeyPairSync } = require('crypto');
const jwt = require('jsonwebtoken');
import { expect } from 'chai';

describe('JWT Test', () => {

    it('It should generate key pair, create and validate json web token.', async () => {
        const result =  generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: 'top secret'
            }
        });
        const publicKey: string = result.publicKey;
        const privateKey: string = result.privateKey;
        console.log(publicKey);
        console.log(Buffer.from(publicKey).toString('base64'));
        console.log(privateKey);
        console.log(Buffer.from(privateKey).toString('base64'));

        var token = jwt.sign({ foo: 'bar' }, { key: privateKey, passphrase: 'top secret' }, { algorithm: 'RS256'});

        var decoded = jwt.verify(token, publicKey, { algorithm: 'RS256'});
        console.log(decoded.foo)

    });

    it('It should create and validate id token.', async () => {
        const publicKeyEncoded: string = "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFwbDlqT0lrdjcrTVFwYzNZMVVUego5RE5TWFFlUUpSSThJZ2tIb3lLVDJGWGxhdHkrREJoNDJxTGRjc1JVV2hUNkJjVGRWKyszTUk5bVVsdVVBOHpjCjZzL29ZUi9RM0Q4RkpVaTJPZThWWGh2MS9lZERRVTJUZ3VZYUJ2eGlWWllYbFh1RGtqVTA1aUtNWWRpQmNGcDgKOHQ0RkRGUFVNUkdnTU5XcElEeEdPZUN4TjB2OG90dDNPQmtGSHlva0dkeE12dTFxNUtWUzRZNjBEOFVnQy80aQpJR0UzUUNMcUl6WitqbTBvOHZBcWdKRy9yQUw1VW11ZlIrS25XZElJVmZIeWhad3hGald1dXJmUFp3S1gyM2FqCmdjSURGalBmMVhkZVdkRVZpQ0dBRGVhaVlmeXJDazVFK0k3eDM4WmoxZUhxbGpKWWg2bzJqYUtKeEhzSDBaSksKdXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==";
        const privateKeyEncoded: string = "LS0tLS1CRUdJTiBFTkNSWVBURUQgUFJJVkFURSBLRVktLS0tLQpNSUlGTFRCWEJna3Foa2lHOXcwQkJRMHdTakFwQmdrcWhraUc5dzBCQlF3d0hBUUljV2g2ejlFTVlNMENBZ2dBCk1Bd0dDQ3FHU0liM0RRSUpCUUF3SFFZSllJWklBV1VEQkFFcUJCQnFPcFhieDcxTkpaQktNUi82OHE3MkJJSUUKMEhWQk4wdWZ3YTNVcllPL0orS0RWdHZZQVY0SGtaM1JCUDlENkRLdXRQSzkyd1Q2Q2lPQjh3Y2ZTajFkRUVnbApGSFpORGg3Zk1oS25tNjhTWnlZdUNWNjlkbVpCTURMZzVQcUV0anZ3UTFKNXBwTUNuRGdMS3JpWUk0bVBmaHJDCmc4T2dmb2d1czlmY1M1L3R5blYrVmREQXRWWG5VNVdWNkduUTcxMUNIUXR0emdOWk1GOGZlbDV5bVhpeDhrRUEKV25TdDJwQVdYckdOQ3RCdzgvOFhmUTFnejRMaHpxY1dHeE1zWjFHb1FRRVRUNExwc1RZN21pc0pVOGhTRVBpagpVeVFMMVlwMGpESXBuSUJOckwwY1F1cWl5TE4yRkRLRi9EQWp4V1RlSnNtYTF5a3E1MjhxWHdKNTQzaDlBc1FKClVWaDlhZW1mUEUyUjI5RU82cy9qcVpUZ29JWDJLUzZKZzhCYWc4UHJya1lRQnp3RUNOamlCRWlKY2NIK2JEekgKVnZLd0N3MmduTVgyam5KNTdZVHJDcXB6MVFkTDFlbm52dEpVTUhqTndhM1BBQThQWU1HanZSNzJkOHRGMm5lUwprUjY0UEtiQlFqS2RjdUdwSzR5UEhzQTN4UTJobkIvVWJpMjZKVzJRQjFGckJNc1Z5bmtzZlAwWUtaV3A0c3NRCmY4azJyaWlkOXB1dk91RHl1OHUwVm42bHZFT2Y5MXY5Q2w4NUdlU2JnM0w2UEovSExTUllyU2ZyT21tL29TQTEKSFhISmJoN2g4QzZYbll4YzZrdEp5bXg0NFdPNnFkSG84ckFUelhzQUpoYlh6L3ZXaEpkNzdEMnRUTitSM00zbgo5TEJlUXpPcWYyQVdlTFZZRnRSdlE1VU9HMzlsbjVaYllWSTgzOFppN0ZjakxRU2FINEpualJsbktlejF1RDhLCnBwdWtVVmFZZi9SeElHdkJwUGQrREIreXpyZzRVQVZ6bXk1OW43TDkxSWxmbnFBaFk1d2ZTRkJ4Q2ZSY1dFeEEKWWJWZTZ2OTMrdWNnRE9qeHdyUXpUa2ltMkJTRkhlMEIraXVVaEpDa2ZWNHZtYk1VR2FpQ3dpNnJxc1NsdnBlMQpCQlhFSG1OMDVDcGhIMEtJVEM0cmhLQXhzYkRpNXd2c1hZUnhpdGp0TmthQUZCejk4dXhJem5tSkplc29VQmx3CmtlbnNxb3czaGlLbVN5ajZRYndneWNSVEV2Qm9oeDYvdkJXNEtwRlpSaVo1T2ZDRDV2QlRneWFBakh4K0RmWXYKNnJDZmlHdHVITEJ0MTlmS01BekZIaXQ0WTFsRk81dHpjTUlCemhIdGN0VE5wN21IVS9sZkVrVGJHYVJYMUt3QQp6MWlQU2lDMUJvMlVQczRudVl4V1l4SmlYRFhaV2wrOWFWS2doSlpacmJKUjFyL0c5MkZUSHBzSXVhMGZnMDNVCjliWUhEWWNOM3Z1S25YcEluUk9MRm1oY0grOWd4OXdZRkxJT0IvS2tkUm93K2NMclk0NllMNVR2QUFYWG5maEIKc3kvc0xRcDhqaFY0TTg0VEpLS1g2YmN3ZUVsSzVDakJpVmE4MDNuSFp0SUd6c2N5UW9meDA1ejFWWHVIK1ZEcwova1hmTW1FenZ1RUdCK2t3MW9vbDJPczB2Q3FsV2hoQzlSTXB4KzRrbGlUbkhrbE1hcWpFc2hXQlloVVV3aG0rCkFqejMzWVUxTndtZXpDaENEYkxuQnkxeEFZR1c5TWtGUzRiYmZWSnN6cTRYYjdFYlg1K1NBU2N6c2RTcGZvc3UKL0Jxa2Y1K0xzc09vQVFqWER5cUJsb3VhcGptNDJZNk5peDl3ZGQ4NTdOMTB1cysvakd1ckt4bFJ1OVFsWE4rQwp3Q2VSUzZpemlPbXd4SVlGV25nSWZncGxaMDNVdWxENStDak1NQkV1eXZ3WnRnZUZMUkxJTnlmcGFvdGRBR3ExCldsVXRRVG9iaWFkT3dWQ29TV0M4SkkwbEUwSEVMYlIzNHJQZ0Mrck1BeTB2clpkd0FyKzd1aWpzWk5Md2dkQVYKT2luRnppajJ0bHlqN0E3cG1QK0tQTnNmYlZnbzJsMzR2SUp5UjhOR0docFk1Rkt4YnVYZHpBZ0szb0xFTlRIWQo3WGtPbWhqR2djdE4zSXJsVmZpekV5bDJkWVhCNndUVVZOa0lGVzlPeUE3RQotLS0tLUVORCBFTkNSWVBURUQgUFJJVkFURSBLRVktLS0tLQo=";
        const idToken = createIdToken("test-issuer", "1", "test@test", "test", privateKeyEncoded);
        const claims = validateIdToken(idToken, publicKeyEncoded);
        console.log(claims);
        expect(claims.get("iss")).equal("test-issuer");
        expect(claims.get("id")).equal("1");
        expect(claims.get("email")).equal("test@test");
        expect(claims.get("name")).equal("test");
    });

    it('It should create and decode id token.', async () => {
        const publicKeyEncoded: string = "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFwbDlqT0lrdjcrTVFwYzNZMVVUego5RE5TWFFlUUpSSThJZ2tIb3lLVDJGWGxhdHkrREJoNDJxTGRjc1JVV2hUNkJjVGRWKyszTUk5bVVsdVVBOHpjCjZzL29ZUi9RM0Q4RkpVaTJPZThWWGh2MS9lZERRVTJUZ3VZYUJ2eGlWWllYbFh1RGtqVTA1aUtNWWRpQmNGcDgKOHQ0RkRGUFVNUkdnTU5XcElEeEdPZUN4TjB2OG90dDNPQmtGSHlva0dkeE12dTFxNUtWUzRZNjBEOFVnQy80aQpJR0UzUUNMcUl6WitqbTBvOHZBcWdKRy9yQUw1VW11ZlIrS25XZElJVmZIeWhad3hGald1dXJmUFp3S1gyM2FqCmdjSURGalBmMVhkZVdkRVZpQ0dBRGVhaVlmeXJDazVFK0k3eDM4WmoxZUhxbGpKWWg2bzJqYUtKeEhzSDBaSksKdXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==";
        const privateKeyEncoded: string = "LS0tLS1CRUdJTiBFTkNSWVBURUQgUFJJVkFURSBLRVktLS0tLQpNSUlGTFRCWEJna3Foa2lHOXcwQkJRMHdTakFwQmdrcWhraUc5dzBCQlF3d0hBUUljV2g2ejlFTVlNMENBZ2dBCk1Bd0dDQ3FHU0liM0RRSUpCUUF3SFFZSllJWklBV1VEQkFFcUJCQnFPcFhieDcxTkpaQktNUi82OHE3MkJJSUUKMEhWQk4wdWZ3YTNVcllPL0orS0RWdHZZQVY0SGtaM1JCUDlENkRLdXRQSzkyd1Q2Q2lPQjh3Y2ZTajFkRUVnbApGSFpORGg3Zk1oS25tNjhTWnlZdUNWNjlkbVpCTURMZzVQcUV0anZ3UTFKNXBwTUNuRGdMS3JpWUk0bVBmaHJDCmc4T2dmb2d1czlmY1M1L3R5blYrVmREQXRWWG5VNVdWNkduUTcxMUNIUXR0emdOWk1GOGZlbDV5bVhpeDhrRUEKV25TdDJwQVdYckdOQ3RCdzgvOFhmUTFnejRMaHpxY1dHeE1zWjFHb1FRRVRUNExwc1RZN21pc0pVOGhTRVBpagpVeVFMMVlwMGpESXBuSUJOckwwY1F1cWl5TE4yRkRLRi9EQWp4V1RlSnNtYTF5a3E1MjhxWHdKNTQzaDlBc1FKClVWaDlhZW1mUEUyUjI5RU82cy9qcVpUZ29JWDJLUzZKZzhCYWc4UHJya1lRQnp3RUNOamlCRWlKY2NIK2JEekgKVnZLd0N3MmduTVgyam5KNTdZVHJDcXB6MVFkTDFlbm52dEpVTUhqTndhM1BBQThQWU1HanZSNzJkOHRGMm5lUwprUjY0UEtiQlFqS2RjdUdwSzR5UEhzQTN4UTJobkIvVWJpMjZKVzJRQjFGckJNc1Z5bmtzZlAwWUtaV3A0c3NRCmY4azJyaWlkOXB1dk91RHl1OHUwVm42bHZFT2Y5MXY5Q2w4NUdlU2JnM0w2UEovSExTUllyU2ZyT21tL29TQTEKSFhISmJoN2g4QzZYbll4YzZrdEp5bXg0NFdPNnFkSG84ckFUelhzQUpoYlh6L3ZXaEpkNzdEMnRUTitSM00zbgo5TEJlUXpPcWYyQVdlTFZZRnRSdlE1VU9HMzlsbjVaYllWSTgzOFppN0ZjakxRU2FINEpualJsbktlejF1RDhLCnBwdWtVVmFZZi9SeElHdkJwUGQrREIreXpyZzRVQVZ6bXk1OW43TDkxSWxmbnFBaFk1d2ZTRkJ4Q2ZSY1dFeEEKWWJWZTZ2OTMrdWNnRE9qeHdyUXpUa2ltMkJTRkhlMEIraXVVaEpDa2ZWNHZtYk1VR2FpQ3dpNnJxc1NsdnBlMQpCQlhFSG1OMDVDcGhIMEtJVEM0cmhLQXhzYkRpNXd2c1hZUnhpdGp0TmthQUZCejk4dXhJem5tSkplc29VQmx3CmtlbnNxb3czaGlLbVN5ajZRYndneWNSVEV2Qm9oeDYvdkJXNEtwRlpSaVo1T2ZDRDV2QlRneWFBakh4K0RmWXYKNnJDZmlHdHVITEJ0MTlmS01BekZIaXQ0WTFsRk81dHpjTUlCemhIdGN0VE5wN21IVS9sZkVrVGJHYVJYMUt3QQp6MWlQU2lDMUJvMlVQczRudVl4V1l4SmlYRFhaV2wrOWFWS2doSlpacmJKUjFyL0c5MkZUSHBzSXVhMGZnMDNVCjliWUhEWWNOM3Z1S25YcEluUk9MRm1oY0grOWd4OXdZRkxJT0IvS2tkUm93K2NMclk0NllMNVR2QUFYWG5maEIKc3kvc0xRcDhqaFY0TTg0VEpLS1g2YmN3ZUVsSzVDakJpVmE4MDNuSFp0SUd6c2N5UW9meDA1ejFWWHVIK1ZEcwova1hmTW1FenZ1RUdCK2t3MW9vbDJPczB2Q3FsV2hoQzlSTXB4KzRrbGlUbkhrbE1hcWpFc2hXQlloVVV3aG0rCkFqejMzWVUxTndtZXpDaENEYkxuQnkxeEFZR1c5TWtGUzRiYmZWSnN6cTRYYjdFYlg1K1NBU2N6c2RTcGZvc3UKL0Jxa2Y1K0xzc09vQVFqWER5cUJsb3VhcGptNDJZNk5peDl3ZGQ4NTdOMTB1cysvakd1ckt4bFJ1OVFsWE4rQwp3Q2VSUzZpemlPbXd4SVlGV25nSWZncGxaMDNVdWxENStDak1NQkV1eXZ3WnRnZUZMUkxJTnlmcGFvdGRBR3ExCldsVXRRVG9iaWFkT3dWQ29TV0M4SkkwbEUwSEVMYlIzNHJQZ0Mrck1BeTB2clpkd0FyKzd1aWpzWk5Md2dkQVYKT2luRnppajJ0bHlqN0E3cG1QK0tQTnNmYlZnbzJsMzR2SUp5UjhOR0docFk1Rkt4YnVYZHpBZ0szb0xFTlRIWQo3WGtPbWhqR2djdE4zSXJsVmZpekV5bDJkWVhCNndUVVZOa0lGVzlPeUE3RQotLS0tLUVORCBFTkNSWVBURUQgUFJJVkFURSBLRVktLS0tLQo=";
        const idToken = createIdToken("test-issuer", "1", "test@test", "test", privateKeyEncoded);
        const claims = decodeIdToken(idToken);
        console.log(claims);
        expect(claims.get("iss")).equal("test-issuer");
        expect(claims.get("id")).equal("1");
        expect(claims.get("email")).equal("test@test");
        expect(claims.get("name")).equal("test");
    });

});

