import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { ChatComponent } from "../../../game/chat/ChatComponent";
import { Client } from "../../Client";
import { Console } from "../../../game/Console";

export class DisconnectPacket implements IClientboundPacket {
    private _Client: Client;
    private _Reason: ChatComponent;

    public PacketID: number = 0x1b;

    constructor(client: Client, reason: ChatComponent) {
        this._Client = client;
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
        Console.Debug(`(${this._Client.ClientId})`, "[S → C]", "[DisconnectPacket]",`Disconnecting client for "${this._Reason}"`);
        buf.WriteJSON(this._Reason);
    }
}
