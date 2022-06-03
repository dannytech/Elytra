import { Constants } from "../../../Configuration";
import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { Client, CompressionState } from "../../Client";
import { Console } from "../../../game/Console";

export class SetCompressionPacket extends ClientboundPacket {
    /**
     * Tell the client to enable compression.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} Threshold The threshold at which to use compression, in bytes.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Tell the socket to enable compression after this packet is sent
        Console.Debug(`(${this._Client.ClientId})`.magenta, "[S → C]".blue, "[SetCompressionPacket]".green,
            "Enabling compression");
        this._Client.Compression = CompressionState.Enabling;

        // Threshold to compress packets
        buf.WriteVarInt(Constants.CompressionThreshold);
    }

    /**
     * Enable compression after alerting the client
     * @async
     */
    public async AfterSend() {
        this._Client.Compression = CompressionState.Enabled;
    }
}
