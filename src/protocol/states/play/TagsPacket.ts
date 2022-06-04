import { Console } from "../../../game/Console";
import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class TagsPacket extends ClientboundPacket {
    /**
     * Tell the client all the identifiers for the tags they can use.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} BlockTags An array of block identifiers.
     * @property {number} ItemTags An array of item identifiers.
     * @property {number} FluidTags An array of fluid identifiers.
     * @property {number} EntityTags An array of entity identifiers.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // TODO Add tags
        Console.DebugPacket(this, "Sending dummy tags");
        buf.WriteVarInt(0); // Block tags
        buf.WriteVarInt(0); // Item tags
        buf.WriteVarInt(0); // Fluid tags
        buf.WriteVarInt(0); // Entity tags
    }
}