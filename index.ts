import { Server } from "net";
import * as crypto from "crypto";
import * as nconf from "nconf";
import { Settings, State } from "./src/Configuration";
import { Database } from "./src/Database";
import { ClientBus } from "./src/protocol/ClientBus";
import { Keypair } from "./src/protocol/Encryption";

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
    const databaseUri: string = nconf.get("database");
    await Database.Connect(databaseUri);
    console.log(`Connected to database with URI ${databaseUri}`);
}

async function startConsole() {
    console.log("Starting interactive console");
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
    console.log(`Starting REST API on port ${nconf.get("api:port")}`);
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
