import { Settings, MinecraftConfigs, State, Environment } from "../Configuration";
import { Client } from "../protocol/Client";
import { ClientboundPacket, ServerboundPacket } from "../protocol/Packet";
import "colors";

/*eslint @typescript-eslint/no-explicit-any: ["error", { "ignoreRestArgs": true }]*/

export class StandardConsole {
    /**
     * Log to the console
     * @param {...any} message The message to write to the console
     */
    public Log(...message: any[]) {
        // Writes messages to the console if it is currently unblocked
        if (State.Environment !== Environment.TEST)
            console.log(...message);
    }

    public Info(...message: any[]) {
        this.Log("[INFO]".black.bgBlue, ...message);
    }

    public Error(...message: any[]) {
        this.Log("[ERROR]".white.bgRed, ...message);
    }

    public Warn(...message: any[]) {
        this.Log("[WARN]".black.bgYellow, ...message);
    }

    /**
     * Logs debug messages to the console if debug mode is enabled
     * @param {...any} message The message to write to the console
     */
    public Debug(...message: any[]) {
        const debug: boolean = Settings.Get(MinecraftConfigs.Debug);
        if (debug)
            this.Log("[DEBUG]".black.bgGreen, ...message);
    }

    /**
     * Print a message to the console in the context of a particular client and packet
     * @param {ClientboundPacket|ServerboundPacket} packet The packet which the message is related to
     * @param {...any} message The message to write to the console
     */
    public DebugPacket(packet: ClientboundPacket | ServerboundPacket, ...message: any[]) {
        // Determine the packet direction
        const direction: string[] = ["S", "C"];
        if ("Parse" in packet) direction.reverse();

        // Print details about the client and packet, in addition to the message
        const client: Client = packet.Client;
        this.Debug(`(${client.Protocol.clientId})`.magenta, `[${direction[0]} → ${direction[1]}]`.blue, `[${packet.constructor.name}]`.cyan, ...message);
    }

    /**
     * Print a message to the console if tracing is enabled
     * @param {...any} message The detailed message to write to the console
     */
    public Trace(...message: any[]) {
        const trace: boolean = Settings.Get(MinecraftConfigs.Trace);
        if (trace)
            this.Log("[TRACE]".white.bgBlack, ...message);
    }
}

export const Console: StandardConsole = new StandardConsole();
