import { Logging } from "../../../game/Logging.js";
import { Client } from "../../Client.js";
import { ClientboundPacket } from "../../Packet.js";
import { WritableBuffer } from "../../WritableBuffer.js";

export class PongPacket extends ClientboundPacket {
    private _Payload: bigint;

    constructor(client: Client, payload: bigint) {
        super(client);

        this._Payload = payload;
    }

    /**
     * Echo back a ping payload to the client
     * @param {WritableBuffer} buf The outgoing packet buffer
     * @property {bigint} Payload The ping payload, used to verify pong integrity
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Echo back the contents of the ping
        Logging.DebugPacket(this, "Pong!".yellow);
        buf.WriteInt64(this._Payload, "Payload");
    }
}
