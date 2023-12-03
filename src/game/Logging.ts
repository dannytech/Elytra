import "colors";

import { State, Environment } from "../State.js";
import { Client } from "../protocol/Client.js";
import { ClientboundPacket, ServerboundPacket } from "../protocol/Packet.js";

/*eslint @typescript-eslint/no-explicit-any: ["error", { "ignoreRestArgs": true }]*/

export enum LoggingLevel {
    DEFAULT = 0,
    DEBUG = 1,
    TRACE = 2
}

export class Logging {
    /**
     * Converts the current logging settings to a logging level
     * @returns {LoggingLevel} The currently set logging level
     */
    public static Level(): LoggingLevel {
        switch(process.env.LOGGING) {
            case "trace":
                return LoggingLevel.TRACE;
            case "debug":
                return LoggingLevel.DEBUG;
            case "default":
            default:
                return LoggingLevel.DEFAULT;
        }
    }

    private static _Direction(packet: ClientboundPacket | ServerboundPacket) {
        // Determine the packet direction
        const direction: string[] = ["S", "C"];
        if ("Parse" in packet) direction.reverse();

        return direction.join(" → ");
    }

    /**
     * Log to the console
     * @param {...any} message The message to write to the console
     */
    public static Log(...message: any[]) {
        // Writes messages to the console if it is currently unblocked
        if (State.Environment !== Environment.TEST)
            console.log(...message);
    }

    public static Info(...message: any[]) {
        this.Log("[INFO]".black.bgBlue, ...message);
    }

    public static Error(...message: any[]) {
        this.Log("[ERROR]".white.bgRed, ...message);
    }

    public static Warn(...message: any[]) {
        this.Log("[WARN]".black.bgYellow, ...message);
    }

    /**
     * Logs debug messages to the console if debug mode is enabled
     * @param {...any} message The message to write to the console
     */
    public static Debug(...message: any[]) {
        if (this.Level() >= LoggingLevel.DEBUG)
            this.Log("[DEBUG]".black.bgGreen, ...message);
    }

    /**
     * Print a debug message to the console in the context of a particular client and packet
     * @param {ClientboundPacket|ServerboundPacket} packet The packet which the message is related to
     * @param {...any} message The message to write to the console
     */
    public static DebugPacket(packet: ClientboundPacket | ServerboundPacket, ...message: any[]) {
        // Print details about the client and packet, in addition to the message
        const client: Client = packet.Client;
        this.Debug(`(${client.Protocol.clientId})`.magenta, `[${this._Direction(packet)}]`.blue, `[${packet.constructor.name}]`.cyan, ...message);
    }

    /**
     * Print a message to the console if tracing is enabled
     * @param {...any} message The detailed message to write to the console
     */
    public static Trace(...message: any[]) {
        if (this.Level() >= LoggingLevel.TRACE)
            this.Log("[TRACE]".white.bgBlack, ...message);
    }

    /**
     * Print a trace message to the console in the context of a particular client and packet
     * @param {ClientboundPacket|ServerboundPacket} packet The packet which the message is related to
     * @param {...any} message The message to write to the console
     */
    public static TracePacket(packet: ClientboundPacket | ServerboundPacket, ...message: any[]) {
        // Print details about the client and packet, in addition to the message
        const client: Client = packet.Client;
        this.Trace(`(${client.Protocol.clientId})`.magenta, `[${this._Direction(packet)}]`.blue, `[${packet.constructor.name}]`.cyan, ...message);
    }
}
