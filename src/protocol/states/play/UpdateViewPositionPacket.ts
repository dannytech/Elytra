import { Console } from "../../../game/Console";
import { PlayerPosition } from "../../../game/Player";
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
        const position: PlayerPosition = this._Client.Player.State.position;

        // Write the chunk coordinates
        buf.WriteVarInt(Math.floor(position.x / 16));
        buf.WriteVarInt(Math.floor(position.y / 16));

        Console.DebugPacket(this, "Sending chunk view position update");
    }
}
