import { Server } from "net";
import * as nconf from "nconf";
import { Settings, State } from "./src/Configuration";
import { ClientBus } from "./src/protocol/ClientBus";
import { Keypair } from "./src/protocol/Encryption";

async function startConsole() {

}

async function startListener() {
    const server = new Server();
    const bus = new ClientBus(server);
    
    server.listen(nconf.get("server:port"), nconf.get("server:ip"), () => {
        console.log("Server started");
    });
}

async function startAPI() {

}

(async () => {
    // Load settings from the config file
    Settings.Load();

    // Generate a keypair for protocol encryption
    State.Keypair = await Keypair.Generate();

    // Start the server console
    await startConsole();

    // Start the Minecraft server
    await startListener();

    // Start the API
    await startAPI();
})();
