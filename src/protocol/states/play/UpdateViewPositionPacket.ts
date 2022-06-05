import { Console } from "../../../game/Console";
import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class UpdateViewPositionPacket extends ClientboundPacket {
    /**
     * Update the client's view position.
     * @param {WritableBuffer} buf The packet buffer.
     * @property {number} X The chunk X position.
     * @property {number} Y The chunk Y position.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        Console.DebugPacket(this, "Sending chunk view position update");
        buf.WriteVarInt(0);
        buf.WriteVarInt(0);
    }
}
