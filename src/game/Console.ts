import { EventEmitter } from "events";
import { Settings, MinecraftConfigs } from "../Configuration";
import { Client } from "../protocol/Client";
import { ClientboundPacket, ServerboundPacket } from "../protocol/Packet";

export class StandardConsole extends EventEmitter {
    /**
     * Log to the console.
     * @param {...any} message The message to write to the console.
     */
    public Log(...message: any[]) {
        this.emit("message", ...message);

        // Writes messages to the console if it is currently unblocked
        console.log(message.join(" "));
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
     * Logs debug messages to the console if debug mode is enabled.
     * @param {...any} message The message to write to the console.
     */
    public async Debug(...message: any[]) {
        const debug: boolean = await Settings.Get(MinecraftConfigs.Debug);
        if (debug)
            this.Log("[DEBUG]".black.bgGreen, ...message);
    }

    /**
     * Print a message to the console in the context of a particular client and packet.
     * @param {ClientboundPacket|ServerboundPacket} packet The packet which the message is related to.
     * @param {...any} message The message to write to the console.
     */
    public async DebugPacket(packet: ClientboundPacket | ServerboundPacket, ...message: any[]) {
        // Determine the packet direction
        const direction: string[] = ["S", "C"]
        if ("Parse" in packet) direction.reverse();

        // Print details about the client and packet, in addition to the message
        const client: Client = packet.GetClient();
        this.Debug(`(${client.ClientId})`.magenta, `[${direction[0]} → ${direction[1]}]`.blue, `[${packet.constructor.name}]`.cyan, ...message);
    }
}

export const Console: StandardConsole = new StandardConsole();
