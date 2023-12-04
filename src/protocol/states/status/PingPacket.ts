import { ServerboundPacket } from "../../Packet.js";
import { ReadableBuffer } from "../../ReadableBuffer.js";
import { Logging } from "../../../game/Logging.js";
import { PongPacket } from "./PongPacket.js";

export class PingPacket extends ServerboundPacket {
    /**
     * Parse server pings
     * @param {ReadableBuffer} buf The incoming packet buffer
     * @property {bigint} Payload The ping payload, used to ensure pong integrity
     * @async
     */
    public async Parse(buf: ReadableBuffer) {
        // Generate a packet echoing back the ping payload
        const payload: bigint = buf.ReadInt64("Payload");

        Logging.DebugPacket(this, "Ping!".yellow);
        this._Client.Queue(new PongPacket(this._Client, payload));
    }
}
