import { ClientboundPacket } from "../../Packet.js";
import { WritableBuffer } from "../../WritableBuffer.js";
import { CompressionState } from "../../Client.js";
import { Logging } from "../../../game/Logging.js";
import { MinecraftConfigs, Settings } from "../../../Configuration.js";

export class SetCompressionPacket extends ClientboundPacket {
    /**
     * Tell the client to enable compression
     * @param {WritableBuffer} buf The outgoing packet buffer
     * @property {number} Threshold The threshold at which to use compression, in bytes
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Tell the socket to enable compression after this packet is sent
        Logging.DebugPacket(this, "Enabling compression");
        this._Client.Protocol.compression = CompressionState.Enabling;

        // Threshold to compress packets
        const compressionThreshold: number = Settings.Get(MinecraftConfigs.CompressionThreshold);
        buf.WriteVarInt(compressionThreshold, "Compression Threshold");
    }

    /**
     * Enable compression after alerting the client
     * @async
     */
    public async AfterSend() {
        Logging.TracePacket(this, "Finished enabling compression");

        this._Client.Protocol.compression = CompressionState.Enabled;
    }
}
