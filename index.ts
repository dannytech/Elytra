import { Server as TCPServer } from "net";
import * as crypto from "crypto";
import { r } from "rethinkdb-ts";

import { Settings, MinecraftConfigs } from "./src/Configuration.js";
import { State } from "./src/State.js";
import { Database } from "./src/database/Database.js";
import { Server } from "./src/protocol/Server.js";
import { Keypair } from "./src/protocol/Encryption.js";
import { World } from "./src/game/World.js";
import { Logging } from "./src/game/Logging.js";
import { PacketFactory } from "./src/protocol/PacketFactory.js";
import { WorldModel } from "./src/database/models/WorldModel.js";
import { Locale } from "./src/game/Locale.js";

/**
 * Prepare the server to accept players
 * @async
 */
async function bootstrap() {
    // Load settings from the config file
    Settings.Load();
    Logging.Info("Loaded database configuration");

    // Connect to the database
    await Database.Connect();

    // Cache all settings
    await Settings.Cache();

    // Generate a keypair for protocol encryption
    State.Keypair = await Keypair.Generate();

    // Print out the key fingerprint for debugging purposes
    const publicKey: Buffer = State.Keypair.PublicKey.export({ format: "der", type: "spki" });
    const fingerprint: string = crypto.createHash("md5")
        .update(publicKey)
        .digest("hex")
        .replace(/(\w{2})(?!$)/g, "$1:");
    Logging.Info("Server public key has fingerprint", fingerprint.green);
    Logging.Trace("Server public keypair:", publicKey.toString("hex").green);

    // Load chat translations
    await Locale.Load();

    // Retrieve all existing world data
    const worlds = await r.table<WorldModel>("world")
        .run();

    State.Worlds = new Map();
    if (worlds.length > 0) {
        // Convert and proxy the world objects
        worlds.forEach((world: WorldModel) => {
            State.Worlds.set(world.id, World.Mapper.load(world, true));
        });
    } else {
        Logging.Info("Creating default world");

        // Create a new world
        const newWorld: World = new World();

        // Proxy and map the world
        State.Worlds.set(newWorld.Metadata.id, World.Mapper.proxy(newWorld));
    }
}

/**
 * Start listening for connections from Minecraft clients
 * @async
 */
async function startListener() {
    const server = new TCPServer();

    // Attach a connection handler
    State.Server = new Server(server);

    // Set up a packet factory
    await PacketFactory.Load();

    // Start the server
    const port: number = Settings.Get(MinecraftConfigs.ServerPort);
    const ip: number = Settings.Get(MinecraftConfigs.ServerIP);
    server.listen(port, ip, () => {
        Logging.Info("Server listening on", `${ip}:${port}`.green);
    });
}

/**
 * Start the REST and Websocket APIs to allow for remote management and synchronization
 * @async
 */
/* eslint-disable-next-line @typescript-eslint/no-empty-function */
async function startAPI() {}

(async () => {
    // Prepare the server to start
    await bootstrap();

    // Start the API
    await startAPI();

    const eula: boolean = Settings.Get(MinecraftConfigs.EULA);
    if (eula)
        // Start the Minecraft server
        await startListener();
    else
        Logging.Error("You must accept the EULA first. Go to https://account.mojang.com/documents/minecraft_eula, then set", "eula".green, "to", "true".blue);
})();
