import { Console } from "../../../game/Console";
import { Client } from "../../Client";
import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class PongPacket implements IClientboundPacket {
    private _Client: Client;
    private _Payload: bigint;
    
    public PacketID: number = 0x01;

    constructor(client: Client, payload: bigint) {
        this._Client = client;
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
        Console.Debug(`(${this._Client.ClientId})`, "[S → C]", "[PongPacket]", "Pong!");
        buf.WriteInt64(this._Payload);
    }
}
