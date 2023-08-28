import * as dotenv from "dotenv-extended";
import { ConfigModel } from "./database/models/ConfigModel";
import { Keypair } from "./protocol/Encryption";
import { Server } from "./protocol/Server";
import { World } from "./game/World";
import { VersionSpec, versionSpec } from "./Masking";
import * as joi from "joi";
import { Logging } from "./game/Logging";
import { r } from "rethinkdb-ts";
import { Constants } from "./Constants";

export enum Environment {
    PRODUCTION,
    DEVELOPMENT,
    TEST
}

export enum MinecraftConfigs {
    ServerIP = "serverIp",
    ServerPort = "serverPort",
    ServerVersion = "serverVersionSpec",
    Online = "online",
    AllowCompression = "allowCompression",
    PreventProxy = "preventProxy",
    MaximumPlayers = "maximumPlayers",
    RenderDistance = "renderDistance",
    ReducedDebug = "reducedDebug",
    RespawnScreen = "respawnScreen",
    MOTD = "motd",
    EULA = "eula",
    Filter = "filter"
}

export enum ElytraConfigs {
    ApiIP = "apiIp",
    ApiPort = "apiPort"
}

type SettingsSchema = {
    [namespace: string]: {
        [name: string]: {
            default: unknown,
            cache?: unknown,
            schema: joi.Schema
        }
    }
};

export class Settings {
    private static _schema: SettingsSchema = {
        "minecraft": {
            "serverIp": {
                default: "0.0.0.0",
                schema: joi.string().ip()
            },
            "serverPort": {
                default: 25565,
                schema: joi.number().integer().min(1024).max(65535)
            },
            "serverVersionSpec": {
                default: [versionSpec("578")],
                schema: joi.array().items(joi.object({
                    start: joi.number().integer(),
                    end: joi.number().integer().optional()
                }).custom((value: VersionSpec, helper) => {
                    // Attempts to identify overlapping version specs
                    const overlaps = Constants.SupportedVersions.some((supported: VersionSpec) => {
                        return supported.start <= value.start && value.end <= supported.end;
                    });

                    // Check if there is an overlapping version
                    if (!overlaps)
                        return helper.message({ custom: "Version spec does not include a supported range" });
                    else return true;
                }))
            },
            "online": {
                default: true,
                schema: joi.boolean()
            },
            "preventProxy": {
                default: true,
                schema: joi.boolean()
            },
            "allowCompression": {
                default: true,
                schema: joi.boolean()
            },
            "maximumPlayers": {
                default: 20,
                schema: joi.number().integer().min(1)
            },
            "renderDistance": {
                default: 20,
                schema: joi.number().integer().min(2)
            },
            "reducedDebug": {
                default: false,
                schema: joi.boolean()
            },
            "respawnScreen": {
                default: true,
                schema: joi.boolean()
            },
            "motd": {
                default: "An Elytra server",
                schema: joi.string()
            },
            "eula": {
                default: false,
                schema: joi.boolean()
            },
            "filter": {
                default: [],
                schema: joi.array().items(joi.string().uuid())
            },
            "filterMode": {
                default: "deny",
                schema: joi.string().allow("allow", "deny")
            }
        },
        elytra: {
            "apiIp": {
                default: "127.0.0.1",
                schema: joi.string().ip()
            },
            "apiPort": {
                default: 25575,
                schema: joi.number().integer().min(1024).max(65535)
            }
        }
    };

    /**
     * Load the database URI so we can load other configuration nodes
     * @static
     */
    public static Load() {
        // Load the database URI
        dotenv.load({
            errorOnMissing: true,
            includeProcessEnv: true
        });
    }

    /**
     * Loads the current configs and begins a changestream to receive and cache changes
     */
    public static async Cache() {
        // Load all configs
        const configs = await r.table<ConfigModel>("config")
            .changes({
                includeInitial: true
            })
            .run();

        // Populate the cache array with the configs
        configs.each((err, config) => {
            if (err)
                return Logging.Error("Config sync error:", err.message);

            // Determine whether the change was an insert/update or removal
            const removed = config.new_val == null;

            // Normalize the config to check for
            const val: ConfigModel = removed ? config.old_val : config.new_val;

            // Check if the normalized config path exists
            const valid = val.namespace in this._schema && val.name in this._schema[val.namespace];

            // Update or delete the cache to the received value
            if (valid) {
                if (removed) {
                    Logging.Trace("Unsetting config value", `${val.namespace}:${val.name}`.green, "from database");

                    delete this._schema[val.namespace][val.name].cache;
                } else {
                    Logging.Trace("Received config value", `${val.namespace}:${val.name}`.green, "from database");

                    this._schema[val.namespace][val.name].cache = val.value;
                }
            } else
                Logging.Error("Rejected config sync due to invalid namespace or name", `${val.namespace}:${val.name}`.green);
        });
    }

    /**
     * Load a configuration node from the database
     * @param {string} [namespace=minecraft] The namespace within which the configuration node resides
     * @param {string} name The name of the configuration node to retrieve
     * @returns {any} The retrieved configuration value, or null
     * @static
     * @async
     */
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    public static Get(name: string): any;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    public static Get(namespace: string, name: string): any;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    public static Get(namespaceOrName: string, name?: string): any {
        // Support an overload which assumes the namespace as the first parameter is not necessary
        if (name === undefined) {
            name = namespaceOrName;
            namespaceOrName = Constants.ConfigNamespace;
        }

        // Require the configuration to exist in the schema
        if (!(namespaceOrName in this._schema) || !(name in this._schema[namespaceOrName])) {
            Logging.Error("Invalid config", `${namespaceOrName}:${name}`.green);
            return null;
        }

        // Attempt to load the value from the cache
        const config = this._schema[namespaceOrName][name].cache;

        // Return the loaded value or the default
        if (config != null) {
            Logging.Trace("Cache hit for", `${namespaceOrName}:${name}`.green);

            return config;
        } else {
            Logging.Trace("Cache miss for", `${namespaceOrName}:${name}`.green);

            return this._schema[namespaceOrName][name].default;
        }
    }

    /**
     * Update a configuration node in the database
     * @param {string} [namespace=minecraft] The namespace within which the configuration node should reside
     * @param {string} name The name of the configuration node to update
     * @param {any} value The value to enter as the configuration
     * @static
     * @async
     */
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    public static Set(name: string, value: any): void;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    public static Set(namespace: string, name: string, value: any): void;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    public static Set(namespaceOrName: string, nameOrValue: any, value?: any): void {
        // Support an overload which assumes the namespace as the first parameter is not necessary
        if (value === undefined) {
            value = nameOrValue;
            nameOrValue = namespaceOrName;
            namespaceOrName = Constants.ConfigNamespace;
        }

        // Require the configuration to exist in the schema
        if (!(namespaceOrName in this._schema) || !(nameOrValue in this._schema[namespaceOrName]))
            return Logging.Error("Invalid config", `${namespaceOrName}:${nameOrValue}`.green);

        // Test the config against the validation schema
        const test = this._schema[namespaceOrName][nameOrValue].schema.validate(value, { presence: "required" });
        if (test.error)
            return Logging.Error("Invalid config value", test.error.message.red);

        // Asynchronously update or insert the configuration value
        r.table<ConfigModel>("config")
            .insert({
                namespace: namespaceOrName,
                name: nameOrValue,
                value
            }, {
                conflict: "update"
            })
            .run();
    }
}

export class State {
    public static Keypair: Keypair;
    public static Server: Server;
    public static Worlds: Map<string, World>;

    /**
     * Get the current Node environment
     * @returns {Environment} The current Node environment
     * @static
     */
    public static get Environment(): Environment {
        switch (process.env.NODE_ENV) {
            case "test":
                return Environment.TEST;
            case "production":
                return Environment.PRODUCTION;
            default:
                return Environment.DEVELOPMENT;
        }
    }
}
