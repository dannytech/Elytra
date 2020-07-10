import * as dotenv from "dotenv-extended";
import { ConfigModel, IConfigDocument } from "./database/ConfigModel";
import { Keypair } from "./protocol/Encryption";
import { ClientBus } from "./protocol/ClientBus";
import { World } from "./game/World";

export class Settings {
    private static _Defaults: {
        [namespace: string]: {
            [name: string]: any
        }
    } = {
        minecraft: {
            server_ip: "0.0.0.0",
            server_port: 25565,
            api_ip: "127.0.0.1",
            api_port: 25575,
            online: true,
            preventProxy: true,
            maximumPlayers: 20,
            renderDistance: 20,
            motd: "An Elytra server"
        }
    };

    /**
     * Load the database URI so we can load other configuration nodes
     * @static
     */
    public static Load() {
        // Load the database URI
        dotenv.load();
    }

    /**
     * Load a configuration node from the database.
     * @param {string} name The name of the configuration node to retrieve.
     * @param {string} [namespace=minecraft] The namespace within which the configuration node resides.
     * @returns {any} The retrieved configuration value.
     * @static
     * @async
     */
    public static async Get(name: string, namespace: string = "minecraft") : Promise<any> {
        const playerDocument: IConfigDocument = await ConfigModel.findOne({
            name,
            namespace
        }, [ "value" ]);

        if (playerDocument) return playerDocument.value;
        else return this._Defaults[namespace][name];
    }

    /**
     * Update a configuration node in the database.
     * @param {string} name The name of the configuration node to update.
     * @param {string} namespace The namespace within which the configuration node should reside.
     * @param {any} value The value to enter as the configuration.
     * @static
     * @async
     */
    public static async Set(name: string, namespace: string = "minecraft", value: any) {
        // Update or insert the configuration value
        await ConfigModel.updateOne({
            name,
            namespace
        }, {
            $set: {
                value
            },
            $setOnInsert: {
                name,
                namespace,
                value
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
    public static ProtocolVersion: number = 578;
    public static CompressionThreshold: number = 64;
    public static KeyLength: number = 1024;
    public static VerificationTokenLength: number = 8;
}
