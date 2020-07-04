import { Server } from "net";
import * as crypto from "crypto";
import * as nconf from "nconf";
import { Settings, State } from "./src/Configuration";
import { Database } from "./src/Database";
import { ClientBus } from "./src/protocol/ClientBus";
import { Keypair } from "./src/protocol/Encryption";

/**
 * Prepare the server to accept players
 */
async function bootstrap() {
    // Load settings from the config file
    Settings.Load();
    console.log("Loaded server configuration");

    // Generate a keypair for protocol encryption
    State.Keypair = await Keypair.Generate();

    // Print out the key fingerprint for debugging purposes
    const publicKey: Buffer = State.Keypair.PublicKey.export({ format: "der", type: "spki" });
    const fingerprint: string = crypto.createHash("md5")
        .update(publicKey)
        .digest("hex")
        .replace(/(\w{2})(?!$)/g, "$1:");
    console.log(`Server public key has fingerprint ${fingerprint}`);

    // Connect to the database
    await Database.Connect(nconf.get("database"));
}

/**
 * Start the local console and relevant pseudo-terminals that can be accessed from within the
 * game
 */
async function startConsole() {

}

/**
 * Start listening for connections from Minecraft clients
 */
async function startListener() {
    const server = new Server();

    // Attach a connection handler
    State.ClientBus = new ClientBus(server);
    
    // Start the server
    server.listen(nconf.get("server:port"), nconf.get("server:ip"), () => {
        console.log(`Server listening on port ${nconf.get("server:port")}`);
    });
}

/**
 * Start the REST and Websocket APIs to allow for remote management and synchronization
 */
async function startAPI() {

}

(async () => {
    await bootstrap();

    // Start the server console
    await startConsole();

    // Start the Minecraft server
    await startListener();

    // Start the API
    await startAPI();
})();
