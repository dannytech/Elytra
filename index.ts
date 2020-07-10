import { Server } from "net";
import * as crypto from "crypto";
import { Settings, State } from "./src/Configuration";
import { Database } from "./src/Database";
import { ClientBus } from "./src/protocol/ClientBus";
import { Keypair } from "./src/protocol/Encryption";
import { World } from "./src/game/World";

/**
 * Prepare the server to accept players.
 * @async
 */
async function bootstrap() {
    // Load settings from the config file
    Settings.Load();
    console.log("Loaded database configuration");

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
    await Database.Connect(process.env.MONGO_URI);

    // Load world data
    State.World = await World.Load();
}

/**
 * Start the local console and relevant pseudo-terminals that can be accessed from within the game.
 * @async
 */
async function startConsole() {

}

/**
 * Start listening for connections from Minecraft clients.
 * @async
 */
async function startListener() {
    const server = new Server();

    // Attach a connection handler
    State.ClientBus = new ClientBus(server);
    
    // Start the server
    const port: number = await Settings.Get("server_port", "minecraft");
    const ip: number = await Settings.Get("server_ip", "minecraft");
    server.listen(port, ip, () => {
        console.log(`Server listening on port ${port}`);
    });
}

/**
 * Start the REST and Websocket APIs to allow for remote management and synchronization.
 * @async
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
