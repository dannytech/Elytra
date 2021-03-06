import { Constants } from "../../../Configuration";
import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { Client, CompressionState } from "../../Client";

export class SetCompressionPacket implements IClientboundPacket {
    private _Client: Client;

    public PacketID: number = 0x03;

    constructor(client: Client) {
        this._Client = client;
    }

    /**
     * Tell the client to enable compression.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} Threshold The threshold at which to use compression, in bytes.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Tell the socket to enable compression after this packet is sent
        this._Client.Compression = CompressionState.Enabling;

        // Threshold to compress packets
        buf.WriteVarInt(Constants.CompressionThreshold);
    }
}
