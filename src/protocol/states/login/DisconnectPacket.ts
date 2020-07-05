import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class DisconnectPacket implements IClientboundPacket {
    private _Reason: string;

    public PacketID: number = 0x00;

    constructor(reason: string) {
        this._Reason = reason;
    }

    /**
     * Tell the client to disconnect, sending the reason as a Chat messagae.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {string} Reason A JSON Chat object containing the reason for the disconnect.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Chat component containing reason for disconnect
        buf.WriteJSON({ "text": this._Reason });
    }
}
