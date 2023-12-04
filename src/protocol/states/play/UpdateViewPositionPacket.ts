import { Logging } from "../../../game/Logging.js";
import { EntityPosition } from "../../../game/Entity.js";
import { ClientboundPacket } from "../../Packet.js";
import { WritableBuffer } from "../../WritableBuffer.js";

export class UpdateViewPositionPacket extends ClientboundPacket {
    /**
     * Update the client's view position
     * @param {WritableBuffer} buf The packet buffer
     * @property {number} X The chunk X position
     * @property {number} Y The chunk Y position
     * @async
     */
    public async Write(buf: WritableBuffer) {
        const position: EntityPosition = this._Client.Player.State.position;

        // Write the chunk coordinates
        buf.WriteVarInt(Math.floor(position.x / 16), "Chunk X");
        buf.WriteVarInt(Math.floor(position.y / 16), "Chunk Y");

        Logging.DebugPacket(this, "Sending chunk view position update");
    }
}
