import * as dotenv from "dotenv-extended";
import { ConfigModel, IConfigDocument } from "./database/ConfigModel";
import { Keypair } from "./protocol/Encryption";
import { ClientBus } from "./protocol/ClientBus";
import { World } from "./game/World";

export enum MinecraftConfigs {
    ServerIP = "serverIP",
    ServerPort = "serverPort",
    Online = "online",
    PreventProxy = "preventProxy",
    MaximumPlayers = "maximumPlayers",
    RenderDistance = "renderDistance",
    ReducedDebug = "reducedDebug",
    RespawnScreen = "respawnScreen",
    MOTD = "motd",
    EULA = "eula",
    Filter = "filter",
    Debug = "debug"
}

export enum ElytraConfigs {
    ApiIP = "apiIP",
    ApiPort = "apiPort"
}

export class Settings {
    private static _Defaults: {
        [namespace: string]: {
            [name: string]: any
        }
    } = {
        minecraft: {
            [MinecraftConfigs.ServerIP]: "0.0.0.0",
            [MinecraftConfigs.ServerPort]: 25565,
            [MinecraftConfigs.Online]: true,
            [MinecraftConfigs.PreventProxy]: true,
            [MinecraftConfigs.MaximumPlayers]: 20,
            [MinecraftConfigs.RenderDistance]: 20,
            [MinecraftConfigs.ReducedDebug]: false,
            [MinecraftConfigs.RespawnScreen]: true,
            [MinecraftConfigs.MOTD]: "An Elytra server",
            [MinecraftConfigs.EULA]: false,
            [MinecraftConfigs.Filter]: {
                mode: "deny",
                players: []
            },
            [MinecraftConfigs.Debug]: false
        },
        elytra: {
            [ElytraConfigs.ApiIP]: "127.0.0.1",
            [ElytraConfigs.ApiPort]: 25575
        }
    };

    /**
     * Load the database URI so we can load other configuration nodes
     * @static
     */
    public static Load() {
        // Load the database URI
        dotenv.load({
            errorOnMissing: true
        });
    }

    /**
     * Load a configuration node from the database.
     * @param {string} [namespace=minecraft] The namespace within which the configuration node resides.
     * @param {string} name The name of the configuration node to retrieve.
     * @returns {any} The retrieved configuration value, or null.
     * @static
     * @async
     */
    public static async Get(name: string) : Promise<any>;
    public static async Get(namespace: string, name: string) : Promise<any>;
    public static async Get(namespaceOrName: string, name?: string) : Promise<any> {
        // support an overload which assumes the namespace as the first parameter is not necessary
        if (name === undefined) {
            name = namespaceOrName;
            namespaceOrName = Constants.ConfigNamespace;
        }

        const playerDocument: IConfigDocument = await ConfigModel.findOne({
            namespace: namespaceOrName,
            name: name
        }, [ "value" ]);

        if (playerDocument) return playerDocument.value;
        else if (namespaceOrName === Constants.ConfigNamespace) return this._Defaults[namespaceOrName][name];
    }

    /**
     * Update a configuration node in the database.
     * @param {string} [namespace=minecraft] The namespace within which the configuration node should reside.
     * @param {string} name The name of the configuration node to update.
     * @param {any} value The value to enter as the configuration.
     * @static
     * @async
     */
    public static async Set(name: string, value: any) : Promise<void>;
    public static async Set(namespace: string, name: string, value: any) : Promise<void>;
    public static async Set(namespaceOrName: string, nameOrValue: any, value?: any) : Promise<void> {
        // support an overload which assumes the namespace as the first parameter is not necessary
        if (value === undefined) {
            value = nameOrValue;
            nameOrValue = namespaceOrName;
            namespaceOrName = Constants.ConfigNamespace;
        }

        // Update or insert the configuration value
        await ConfigModel.updateOne({
            namespace: namespaceOrName,
            name: nameOrValue
        }, {
            $set: {
                value: value
            },
            $setOnInsert: {
                namespace: namespaceOrName,
                name: nameOrValue
            }
        }, {
            upsert: true
        });
    }
}

export class State {
    public static Keypair: Keypair;
    public static ClientBus: ClientBus;
    public static World: World;
}

export class Constants {
    public static ServerName: string = "Elytra";
    public static MinecraftVersion: string = "1.15.2";
    public static ConfigNamespace: string = "minecraft";
    public static ProtocolVersion: number = 578;
    public static CompressionThreshold: number = 64;
    public static KeyLength: number = 1024;
    public static VerificationTokenLength: number = 8;
    public static MessageBufferSize: number = 1000000;
}
