import { Console } from "../../../game/Console";
import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";

export class ClientPluginMessagePacket extends ServerboundPacket {
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
        Console.DebugPacket(this, "Received plugin message on channel", channel.green);

        // TODO Do something with the rest of the buffer
    }
}
