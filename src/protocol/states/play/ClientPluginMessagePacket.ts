import { Logging } from "../../../game/Logging";
import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";

export class ClientPluginMessagePacket extends ServerboundPacket {
    /**
     * Read the client brand (usually "vanilla") from the plugin message
     * @param {ReadableBuffer} message The data sent by the client
     * @private
     */
    private _BrandMessage(message: ReadableBuffer) {
        Logging.DebugPacket(this, "Client brand is", message.ReadVarChar().green);
    }

    /**
     * Parse a plugin message from the client
     * @param {ReadableBuffer} buf The incoming packet buffer
     * @property {string} Channel The channel the message is sent on
     * @property {Buffer} Data The message data
     * @async
     */
    public async Parse(buf: ReadableBuffer) {
        // Read the plugin channel
        const channel: string = buf.ReadVarChar();
        const rawMessage: Buffer = buf.Read();
        Logging.DebugPacket(this, "Received plugin message on channel", channel.green, rawMessage.toString("hex").blue);

        // Redirect the rest of the buffer to the correct handler
        const message: ReadableBuffer = new ReadableBuffer(rawMessage);
        switch (channel) {
            case "minecraft:brand":
                this._BrandMessage(message);
                break;
        }
    }
}
