import {Processor} from "./processor/Processor";
import {ServerAvatarClient} from "./server/ServerAvatarClient";
import {loadConfiguration} from "./util/configuration";
import {newRealityServer} from "./server/server";

const config = require('config');
require('isomorphic-fetch');

start().then().catch(e => console.log('reality server - startup error: ', e));

async function start() {

    console.log("reality server - starting up version='" + config.get('Software.version') + "'");

    const clusterConfigurationUrl = config.get('Cluster.configurationUrl') as string;
    console.log("reality server - cluster configuration URL: " + clusterConfigurationUrl);
    const processorUrl = config.get('Processor.url');
    console.log("reality server - processor WS URL: " + processorUrl);
    const storageUrl = config.get('Storage.url');
    console.log("reality server - storage API URL: " + storageUrl);
    const listenIp: string = '0.0.0.0';
    console.log("reality server - listen IP: " + listenIp);
    const listenPort: number = config.get("Server.port");
    console.log("reality server - port: " + listenIp);

    const storageType = config.get('Storage.type').trim().toLocaleLowerCase();
    console.log("reality server - storage type: " + storageType);


    // Load configuration.
    const clusterConfiguration = await loadConfiguration(clusterConfigurationUrl);
    console.log("reality server - loaded configuration: " + JSON.stringify(clusterConfiguration));

    const server = newRealityServer(clusterConfiguration, processorUrl, storageUrl, storageType, listenIp, listenPort);

    // Start listening.
    await server.startup();

    // Start server avatar client.
    if (processorUrl && clusterConfigurationUrl && clusterConfigurationUrl.indexOf("public-test-cluster") != -1) {
        try {
            console.log("reality server - starting test server avatar client...");
            const serverAvatarClient = new ServerAvatarClient(clusterConfigurationUrl);
            await serverAvatarClient.start();
            console.log("reality server - started test server avatar client.")
        } catch (error) {
            console.error("reality server - error starting test server avatar client.", error);
        }
    }

    // Add exit hook
    process.on('exit', async () => {
        console.log("reality server - exiting version='" + config.get('Software.version') + "'");
        await server.close();
    });
}


