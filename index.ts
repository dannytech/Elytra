import { Server as TCPServer } from "net";
import * as crypto from "crypto";
import "colors";

import { Settings, State, MinecraftConfigs } from "./src/Configuration";
import { Database } from "./src/Database";
import { Server } from "./src/protocol/Server";
import { Keypair } from "./src/protocol/Encryption";
import { World } from "./src/game/World";
import { Console } from "./src/game/Console";
import { PacketFactory } from "./src/protocol/PacketFactory";
import { WorldModel } from "./src/database/models/WorldModel";
import { r } from "rethinkdb-ts";

/**
 * Prepare the server to accept players.
 * @async
 */
async function bootstrap() {
    // Load settings from the config file
    Settings.Load();
    Console.Info("Loaded database configuration");

    // Generate a keypair for protocol encryption
    State.Keypair = await Keypair.Generate();

    // Print out the key fingerprint for debugging purposes
    const publicKey: Buffer = State.Keypair.PublicKey.export({ format: "der", type: "spki" });
    const fingerprint: string = crypto.createHash("md5")
        .update(publicKey)
        .digest("hex")
        .replace(/(\w{2})(?!$)/g, "$1:");
    Console.Info("Server public key has fingerprint", fingerprint.green);

    // Connect to the database
    await Database.Connect();

    // Retrieve all existing world data
    const worlds = await r.table<WorldModel>("world")
        .run();

    State.Worlds = {};
    if (worlds.length > 0) {
        // Convert and proxy the world objects
        worlds.forEach((world: WorldModel) => {
            State.Worlds[world.id] = World.Mapper.load(world, true);
        });
    } else {
        Console.Info("Creating default world");

        // Create a new world
        const newWorld: World = new World();

        // Proxy and map the world
        State.Worlds[newWorld.Metadata.id] = World.Mapper.proxy(newWorld);
    }
}

/**
 * Start listening for connections from Minecraft clients.
 * @async
 */
async function startListener() {
    const server = new TCPServer();

    // Attach a connection handler
    State.Server = new Server(server);

    // Set up a packet factory
    State.PacketFactory = new PacketFactory();
    await State.PacketFactory.Load();

    // Start the server
    const port: number = await Settings.Get(MinecraftConfigs.ServerPort);
    const ip: number = await Settings.Get(MinecraftConfigs.ServerIP);
    server.listen(port, ip, () => {
        Console.Info("Server listening on", `${ip}:${port}`.green);
    });
}

/**
 * Start the REST and Websocket APIs to allow for remote management and synchronization.
 * @async
 */
/* eslint-disable-next-line @typescript-eslint/no-empty-function */
async function startAPI() {}

(async () => {
    // Prepare the server to start
    await bootstrap();

    // Start the API
    await startAPI();

    const eula: boolean = await Settings.Get(MinecraftConfigs.EULA);
    if (eula)
        // Start the Minecraft server
        await startListener();
    else Console.Error("You must accept the EULA first. Go to https://account.mojang.com/documents/minecraft_eula, then run", "elytractl set eula true".green);
})();
