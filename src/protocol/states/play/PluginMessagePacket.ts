import { Console } from "../../../game/Console";
import { Client } from "../../Client";
import { ClientboundPacket, ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { WritableBuffer } from "../../WritableBuffer";

export class ServerPluginMessagePacket extends ClientboundPacket {
    private _Channel: string;
    private _Message: Buffer;

    constructor(client: Client, channel: string, message: any) {
        super(client);

        this._Channel = channel;
        this._Message = Buffer.from(message);
    }

    /**
     * Tell the client about a server plugin message.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {string} Channel The channel the message is sent on.
     * @property {Buffer} Data The message data.
     * @async
     */
    public async Write(buf: WritableBuffer): Promise<void> {
        // Write the plugin channel
        Console.Debug(`(${this._Client.ClientId})`.magenta, "[S → C]".blue, "[ServerPluginMessagePacket]".green,
            `Sending plugin message on channel ${this._Channel.green}`);
        buf.WriteVarChar(this._Channel);

        // Write the arbitrary data for the plugin
        buf.Write(this._Message);
    }
}

export class ClientPluginMessagePacket implements IServerboundPacket {
    private _Client: Client;

    constructor(client: Client) {
        this._Client = client;
    }

    /**
     * Parse a plugin message from the client.
     * @param {ReadableBuffer} buf The incoming packet buffer.
     * @property {string} Channel The channel the message is sent on.
     * @property {Buffer} Data The message data.
     * @async
     */
    public async Parse(buf: ReadableBuffer) {
        // Read the plugin channel
        const channel: string = buf.ReadVarChar();
        Console.Debug(`(${this._Client.ClientId})`.magenta, "[C → S]".blue, "[ClientPluginMessagePacket]".green,
            `Received plugin message on channel ${channel.green}`);

        // Read the arbitrary data for the plugin
        const data: any = buf.Read();
    }
}
