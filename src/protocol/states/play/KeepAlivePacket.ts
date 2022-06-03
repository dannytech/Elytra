import { ChatComponentFactory } from "../../../game/chat/ChatComponentFactory";
import { Console } from "../../../game/Console";
import { Client } from "../../Client";
import { ClientboundPacket, ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { WritableBuffer } from "../../WritableBuffer";
import { DisconnectPacket } from "./DisconnectPacket";

export class ServerKeepAlivePacket extends ClientboundPacket {
    private _KeepAliveId: bigint;

    constructor(client: Client, keepAliveId?: bigint) {
        super(client);

        if (keepAliveId)
            this._KeepAliveId = keepAliveId;
        else {
            // Generate a 64-bit hex number
            const id: string = Array(8)
                .fill(null)
                .map(() => Math.floor(Math.random() * 0xF).toString(16))
                .join("");

            this._KeepAliveId = BigInt("0x" + id);
        }
    }

    /**
     * Send a keep alive packet.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {bigint} KeepAliveId The keep alive ID.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Write a unique ID which must be echoed back
        buf.WriteInt64(this._KeepAliveId);
    }

    /**
     * Save the keep alive ID to verify it was replied to later.
     * @async
     */
    public async AfterSend() {
        this._Client.KeepAlive.id = this._KeepAliveId;
        this._Client.KeepAlive.sent = Date.now();
    }
}

export class ClientKeepAlivePacket extends ServerboundPacket {
    /**
     * Verify the keep alive ID.
     * @param {ReadableBuffer} buf The incoming packet buffer.
     * @property {bigint} KeepAliveId The keep alive ID.
     * @async
     */
    public async Parse(buf: ReadableBuffer) {
        const keepAliveId: bigint = buf.ReadInt64();

        // If the keepalives don't match, disconnect
        if (keepAliveId !== this._Client.KeepAlive.id) {
            Console.DebugPacket(this, "Keep alive IDs do not match,", keepAliveId.toString().green, "!=", this._Client.KeepAlive.id.toString().green);
            this._Client.Queue(new DisconnectPacket(this._Client, ChatComponentFactory.FromString("Client failed keep-alive")), true);
        } else {
            // Reset the keep alive timer
            const now: number = Date.now();
            this._Client.KeepAlive.last = now;

            // Calculate the client latency
            this._Client.Player.Latency = now - this._Client.KeepAlive.sent;
        }
    }
}
