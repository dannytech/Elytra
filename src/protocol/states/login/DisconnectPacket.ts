import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class DisconnectPacket implements ClientboundPacket {
    private _Reason: string;

    public PacketID: number = 0x00;

    constructor(reason: string) {
        this._Reason = reason;
    }

    public Write(buf: WritableBuffer) : void {
        // Chat component containing reason for disconnect
        buf.WriteJSON({ "text": this._Reason });
    }
}