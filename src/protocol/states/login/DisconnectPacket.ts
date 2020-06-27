import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class DisconnectPacket implements IClientboundPacket {
    private _Reason: string;

    public PacketID: number = 0x00;

    constructor(reason: string) {
        this._Reason = reason;
    }

    public async Write(buf: WritableBuffer) {
        // Chat component containing reason for disconnect
        buf.WriteJSON({ "text": this._Reason });
    }
}
