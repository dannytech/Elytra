import { Client } from "../../Client";
import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

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
