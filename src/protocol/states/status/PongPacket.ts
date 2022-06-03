import { Console } from "../../../game/Console";
import { Client } from "../../Client";
import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class PongPacket extends ClientboundPacket {
    private _Payload: bigint;

    constructor(client: Client, payload: bigint) {
        super(client);

        this._Payload = payload;
    }

    /**
     * Echo back a ping payload to the client.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {bigint} Payload The ping payload, used to verify pong integrity.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Echo back the contents of the ping
        Console.Debug(`(${this._Client.ClientId})`.magenta, "[S → C]".blue, "[PongPacket]".green,
            "Pong!".yellow);
        buf.WriteInt64(this._Payload);
    }
}
