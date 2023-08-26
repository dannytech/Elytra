import * as dotenv from "dotenv-extended";
import { ConfigModel } from "./database/models/ConfigModel";
import { Keypair } from "./protocol/Encryption";
import { Server } from "./protocol/Server";
import { World } from "./game/World";
import { VersionSpec, versionSpec } from "./Masking";
import * as joi from "joi";
import { Console } from "./game/Console";
import { r } from "rethinkdb-ts";

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
    PreventProxy = "preventProxy",
    MaximumPlayers = "maximumPlayers",
    RenderDistance = "renderDistance",
    ReducedDebug = "reducedDebug",
    RespawnScreen = "respawnScreen",
    MOTD = "motd",
    EULA = "eula",
    Filter = "filter",
    Debug = "debug",
    Trace = "trace"
}

export enum ElytraConfigs {
    ApiIP = "apiIp",
    ApiPort = "apiPort"
}

type SettingsSchema = {
    [namespace: string]: {
        [name: string]: {
            default: unknown,
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
            },
            "debug": {
                default: false,
                schema: joi.boolean()
            },
            "trace": {
                default: false,
                schema: joi.boolean()
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
     * Load a configuration node from the database
     * @param {string} [namespace=minecraft] The namespace within which the configuration node resides
     * @param {string} name The name of the configuration node to retrieve
     * @returns {any} The retrieved configuration value, or null
     * @static
     * @async
     */
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    public static async Get(name: string): Promise<any>;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    public static async Get(namespace: string, name: string): Promise<any>;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    public static async Get(namespaceOrName: string, name?: string): Promise<any> {
        // Support an overload which assumes the namespace as the first parameter is not necessary
        if (name === undefined) {
            name = namespaceOrName;
            namespaceOrName = Constants.ConfigNamespace;
        }

        // Require the configuration to exist in the schema
        if (!Object.keys(this._schema).includes(namespaceOrName) || !Object.keys(this._schema[namespaceOrName]).includes(name)) {
            Console.Error("Invalid config", `${namespaceOrName}:${name}`.green);
            return null;
        }

        // Retrieve the relevant config object
        const config = await r.table<ConfigModel>("config")
            .getAll([
                namespaceOrName,
                name
            ], { index: "namespaced_config" })
            .pluck("value")
            .limit(1)
            .run();

        // Return the loaded value or the default
        if (config.length > 0)
            return config.pop().value;
        else
            return this._schema[namespaceOrName][name].default;
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
    public static async Set(name: string, value: any): Promise<void>;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    public static async Set(namespace: string, name: string, value: any): Promise<void>;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    public static async Set(namespaceOrName: string, nameOrValue: any, value?: any): Promise<void> {
        // Support an overload which assumes the namespace as the first parameter is not necessary
        if (value === undefined) {
            value = nameOrValue;
            nameOrValue = namespaceOrName;
            namespaceOrName = Constants.ConfigNamespace;
        }

        // Require the configuration to exist in the schema
        if (!Object.keys(this._schema).includes(namespaceOrName) || !Object.keys(this._schema[namespaceOrName]).includes(nameOrValue))
            return Console.Error("Invalid config", `${namespaceOrName}:${nameOrValue}`.green);

        // Test the config against the validation schema
        const test = this._schema[namespaceOrName][nameOrValue].schema.validate(value, { presence: "required" });
        if (test.error)
            return Console.Error("Invalid config value", test.error.message.red);

        // Update or insert the configuration value
        await r.table<ConfigModel>("config")
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

export class Constants {
    public static ServerName = "Elytra";
    public static ConfigNamespace = "minecraft";
    public static ProtocolVersion = 578;
    public static CompressionThreshold = 64;
    public static KeyLength = 1024;
    public static VerificationTokenLength = 8;
    public static MaximumPacketLength = 2 * 1024 * 1024;
    public static KeepAliveInterval = 5000;
    public static SupportedVersions = [versionSpec("578")];
}
