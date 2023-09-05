import { World } from "./game/World";
import { Keypair } from "./protocol/Encryption";
import { Server } from "./protocol/Server";


export enum Environment {
    PRODUCTION,
    DEVELOPMENT,
    TEST
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
