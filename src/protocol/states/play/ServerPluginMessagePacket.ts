import { Logging } from "../../../game/Logging.js";
import { Client } from "../../Client.js";
import { ClientboundPacket } from "../../Packet.js";
import { WritableBuffer } from "../../WritableBuffer.js";

export class ServerPluginMessagePacket extends ClientboundPacket {
    private _Channel: string;
    private _Message: Buffer;

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    constructor(client: Client, channel: string, message: any) {
        super(client);

        this._Channel = channel;
        this._Message = Buffer.from(message);
    }

    /**
     * Tell the client about a server plugin message
     * @param {WritableBuffer} buf The outgoing packet buffer
     * @property {string} Channel The channel the message is sent on
     * @property {Buffer} Data The message data
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Write the plugin channel
        Logging.DebugPacket(this, "Sending plugin message on channel", this._Channel.green, this._Message.toString("hex").blue);
        buf.WriteVarChar(this._Channel, "Channel");

        // Write the arbitrary data for the plugin
        buf.Write(this._Message, "Message");
    }
}
