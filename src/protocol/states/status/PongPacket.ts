import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class PongPacket implements IClientboundPacket {
    private _Payload: bigint;
    
    public PacketID: number = 0x01;

    constructor(payload: bigint) {
        this._Payload = payload;
    }

    public async Write(buf: WritableBuffer) {
        // Echo back the contents of the ping
        buf.WriteInt64(this._Payload);
    }
}
