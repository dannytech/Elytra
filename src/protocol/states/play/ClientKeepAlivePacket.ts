import { ChatComponentFactory } from "../../../game/chat/ChatComponentFactory.js";
import { Logging } from "../../../game/Logging.js";
import { ServerboundPacket } from "../../Packet.js";
import { ReadableBuffer } from "../../ReadableBuffer.js";
import { DisconnectPacket } from "./DisconnectPacket.js";

export class ClientKeepAlivePacket extends ServerboundPacket {
    /**
     * Verify the keep alive ID
     * @param {ReadableBuffer} buf The incoming packet buffer
     * @property {bigint} KeepAliveId The keep alive ID
     * @async
     */
    public async Parse(buf: ReadableBuffer) {
        const keepAliveId: bigint = buf.ReadInt64("Keepalive ID");

        // If the keepalives don't match, disconnect
        if (keepAliveId !== this._Client.KeepAlive.id) {
            Logging.DebugPacket(this, "Keep alive IDs do not match,", keepAliveId.toString().green, "!=", this._Client.KeepAlive.id.toString().green);
            this._Client.Queue(new DisconnectPacket(this._Client, ChatComponentFactory.FromString("&t{disconnect.timeout}")), true);
        } else {
            // Reset the keep alive timer
            const now: number = Date.now();
            this._Client.KeepAlive.last = now;

            // Calculate the client latency
            this._Client.Protocol.latency = now - this._Client.KeepAlive.sent;
        }
    }
}
