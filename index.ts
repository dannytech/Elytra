import { Server } from "net";
import * as nconf from "nconf";
import { Settings, State } from "./src/Configuration";
import { Database } from "./src/Database";
import { ClientBus } from "./src/protocol/ClientBus";
import { Keypair } from "./src/protocol/Encryption";

async function bootstrap() {
    // Load settings from the config file
    Settings.Load();

    // Generate a keypair for protocol encryption
    State.Keypair = await Keypair.Generate();

    // Connect to the database
    State.Database = await Database.Connect(nconf.get("database"));
}

async function startConsole() {

}

async function startListener() {
    const server = new Server();

    // Attach a connection handler
    new ClientBus(server);
    
    // Start the server
    server.listen(nconf.get("server:port"), nconf.get("server:ip"), () => {
        console.log(`Server listening on port ${nconf.get("server:port")}`);
    });
}

async function startAPI() {

}

(async () => {
    await bootstrap();

    // Connect to the database
    State.Database = await Database.Connect(nconf.get("database"));

    // Start the server console
    await startConsole();

    // Start the Minecraft server
    await startListener();

    // Start the API
    await startAPI();
})();
