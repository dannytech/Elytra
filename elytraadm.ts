#!/usr/bin/env -S yarn run ts-node

import { Database } from "./src/Database";
import { Settings } from "./src/Configuration";
import { Console } from "./src/game/Console";

/**
 * Connect to the database for configuration changes
 * @async
 */
async function connectToDatabase() {
    // Load settings from the config file
    Settings.Load();
    Console.Info("Loaded database configuration");

    // Connect to the database
    await Database.Connect(process.env.MONGO_URI);
    Console.Info("Connected to database");
}

/**
 * Convert values from the command line arguments to the correct type
 * @param {any} value The value to convert
 * @returns {any} The converted value
 * @async
 */
async function cast(value: any) : Promise<any> {
    switch(value) {
        case "true":
            return true;
        case "false":
            return false;
        default:
            // Convert integers
            if (value.match(/^[0-9]+$/)) {
                return parseInt(value);
            } else return value;
    }
}

(async function() {
    const args: string[] = process.argv.slice(2);

    switch(args.shift()) {
        case "set":
            if (args.length == 2) {
                await connectToDatabase();

                let name: string = args.shift();
                let namespace: string;

                // Determine the config namespace
                const fqn = name.split(":");
                if (fqn.length > 1) {
                    namespace = fqn[0];
                    name = fqn.slice(1).join(":");
                } else namespace = "minecraft";

                // Convert the value to the correct type
                const value: any = await cast(args.shift());

                await Settings.Set(namespace, name, value);
                Console.Info(`Set ${namespace}:${name} = ${value}`);
            }
            break;
        case "get":
            if (args.length == 1) {
                await connectToDatabase();

                let name: string = args.shift();
                let namespace: string;

                // Determine the config namespace
                const fqn: string[] = name.split(":");
                if (fqn.length > 1) {
                    namespace = fqn[0];
                    name = fqn.slice(1).join(":");
                } else namespace = "minecraft";

                const value: string = await Settings.Get(namespace, name);
                Console.Info(`Got ${namespace}:${name} = ${value}`);
            }
            break;
        default:
            Console.Error("Unknown command");
    }

    Database.Disconnect();
})();
