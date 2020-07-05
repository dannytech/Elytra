import { Client } from "../../Client";
import { IServerboundPacket } from "../../Packet";
import { PongPacket } from "./PongPacket";
import { ReadableBuffer } from "../../ReadableBuffer";

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
    public async Parse(buf: ReadableBuffer) : Promise<boolean> {
        // Generate a packet echoing back the ping payload
        const payload: bigint = buf.ReadInt64();

        this._Client.Queue(new PongPacket(payload));

        return true;
    }
}
