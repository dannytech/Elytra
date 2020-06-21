import { Client } from "../../../Client";
import { ServerboundPacket } from "../../Packet";
import { PongPacket } from "./PongPacket";
import { ReadableBuffer } from "../../ReadableBuffer";

export class PingPacket implements ServerboundPacket {
    private _Client: Client;
    
    constructor(client: Client) {
        this._Client = client;
    }
    
    public async Parse(buf: ReadableBuffer) : Promise<void> {
        // Generate a packet echoing back the ping payload
        const payload: bigint = buf.ReadInt64();

        this._Client.Queue(new PongPacket(payload));
    }
}