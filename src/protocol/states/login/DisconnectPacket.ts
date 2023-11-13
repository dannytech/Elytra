import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { ChatComponent } from "../../../game/chat/ChatComponent";
import { Logging } from "../../../game/Logging";
import { Client } from "../../Client";
import { ChatComponentFactory } from "../../../game/chat/ChatComponentFactory";

export class DisconnectPacket extends ClientboundPacket {
    private _Reason: ChatComponent;

    constructor(client: Client, reason: ChatComponent) {
        super(client);

        this._Reason = reason;
    }

    /**
     * Tell the client to disconnect, sending the reason as a Chat messagae
     * @param {WritableBuffer} buf The outgoing packet buffer
     * @property {string} Reason A JSON Chat object containing the reason for the disconnect
     * @async
     */
    public async Write(buf: WritableBuffer) {
        const reason: string = await ChatComponentFactory.GetRaw(this._Reason);
        Logging.DebugPacket(this, "Disconnecting client for", reason.green);

        // Chat component containing reason for disconnect
        buf.WriteChat(this._Reason, "Reason");
    }

    /**
     * Disconnect the client after sending the packet
     * @async
     */
    public async AfterSend() {
        this._Client.Disconnect();
    }
}
