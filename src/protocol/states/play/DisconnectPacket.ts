import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { ChatComponent } from "../../../game/chat/ChatComponent";

export class DisconnectPacket implements IClientboundPacket {
    private _Reason: ChatComponent;

    public PacketID: number = 0x1b;

    constructor(reason: ChatComponent) {
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
        buf.WriteJSON(this._Reason);
    }
}
