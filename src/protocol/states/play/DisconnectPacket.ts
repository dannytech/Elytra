import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { ChatComponent } from "../../../game/chat/ChatComponent";
import { Client } from "../../Client";
import { Console } from "../../../game/Console";
import { ChatComponentFactory } from "../../../game/chat/ChatComponentFactory";

export class DisconnectPacket implements IClientboundPacket {
    private _Client: Client;
    private _Reason: ChatComponent;

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
        const reason: string = ChatComponentFactory.GetRaw(this._Reason);
        Console.Debug(`(${this._Client.ClientId})`, "[S → C]", "[DisconnectPacket]",`Disconnecting client for "${reason}"`);

        // Chat component containing reason for disconnect
        buf.WriteJSON(this._Reason);
    }

    /**
     * Disconnect the client after sending the packet.
     * @async
     */
     public async AfterSend() {
        this._Client.Disconnect();
    }
}
