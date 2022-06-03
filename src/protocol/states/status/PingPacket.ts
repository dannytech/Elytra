import { Client } from "../../Client";
import { IServerboundPacket } from "../../Packet";
import { PongPacket } from "./PongPacket";
import { ReadableBuffer } from "../../ReadableBuffer";
import { Console } from "../../../game/Console";

export class PingPacket implements IServerboundPacket {
    private _Client: Client;

    constructor(client: Client) {
        this._Client = client;
    }

    /**
     * Parse server pings.
     * @param {ReadableBuffer} buf The incoming packet buffer.
     * @property {bigint} Payload The ping payload, used to ensure pong integrity.
     * @async
     */
    public async Parse(buf: ReadableBuffer) {
        // Generate a packet echoing back the ping payload
        const payload: bigint = buf.ReadInt64();

        Console.Debug(`(${this._Client.ClientId})`.magenta, "[C → S]".blue, "[PingPacket]".green,
            "Ping!".yellow);
        this._Client.Queue(new PongPacket(this._Client, payload));
    }
}
