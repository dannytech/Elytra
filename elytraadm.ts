#!/usr/bin/env -S yarn run ts-node

import axios from "axios";
import { Database } from "./src/Database";
import { Settings, Constants, MinecraftConfigs } from "./src/Configuration";
import { Console } from "./src/game/Console";
import { ConfigModel } from "./src/database/ConfigModel";

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
}

/**
 * Convert values from the command line arguments to the correct type
 * @param {any} value The value to convert
 * @returns {any} The converted value
 */
function cast(value: any) : any {
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
                const value: any = cast(args.shift());

                // Set the value
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

                // Extract the value
                const value: string = await Settings.Get(namespace, name);
                Console.Info(`Got ${namespace}:${name} = ${value}`);
            }
            break;
        case "filter":
            if (args.length == 2) {
                await connectToDatabase();

                const action = args.shift();
                const usernameOrMode = args.shift();

                switch (action) {
                    case "add":
                    case "remove":
                        // Convert action to database operation
                        const actions: any = {
                            "add": "$addToSet",
                            "remove": "$pull"
                        }

                        // Resolve the username to a UUID
                        const res = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${usernameOrMode}`);
                        if (res.status == 200) {
                            const uuid: string = res.data.id;

                            // Send the update to the database
                            await ConfigModel.findOneAndUpdate({
                                namespace: Constants.ConfigNamespace,
                                name: MinecraftConfigs.Filter
                            }, {
                                $setOnInsert: {
                                    "value.mode": "allow"
                                },
                                [actions[action]]: {
                                    "value.players": uuid
                                }
                            }, { upsert: true });
                            Console.Info(`Added/removed ${usernameOrMode} -> ${uuid} from filter`);
                        } else Console.Error(`Failed to get UUID for ${usernameOrMode}`);
                        break;
                    case "mode":
                        if (["allow", "deny"].includes(usernameOrMode)) {
                            await ConfigModel.findOneAndUpdate({
                                namespace: Constants.ConfigNamespace,
                                name: MinecraftConfigs.Filter
                            }, {
                                $set: {
                                    "value.mode": usernameOrMode
                                },
                                $setOnInsert: {
                                    "value.players": []
                                }
                            }, { upsert: true });
                            Console.Info(`Set filter mode to ${usernameOrMode}`);
                        } else Console.Error(`Invalid mode ${usernameOrMode}`);
                        break;
                    default:
                        Console.Error(`Invalid filter action: ${action}`);
                }
            }
            break;
        default:
            Console.Error("Unknown command");
    }

    Database.Disconnect();
})();
