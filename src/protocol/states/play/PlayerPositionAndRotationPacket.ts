import { Logging } from "../../../game/Logging.js";
import { ServerboundPacket } from "../../Packet.js";
import { ReadableBuffer } from "../../ReadableBuffer.js";

export class PlayerPositionAndRotationPacket extends ServerboundPacket {
    /**
     * Set the position of the player
     * @param {ReadableBuffer} buf The incoming packet buffer
     * @property {number} x The X coordinate of the player
     * @property {number} y The Y coordinate of the player
     * @property {number} z The Z coordinate of the player
     * @property {number} yaw The Yaw of the player
     * @property {number} pitch The Pitch of the player
     * @property {boolean} onGround Whether the player is on the ground
     * @async
     */
    public async Parse(buf: ReadableBuffer) {
        // Read the full player position
        this._Client.Player.State.position.x = buf.ReadDouble("X");
        this._Client.Player.State.position.y = buf.ReadDouble("Y");
        this._Client.Player.State.position.z = buf.ReadDouble("Z");
        this._Client.Player.State.position.yaw = buf.ReadSingle("Yaw");
        this._Client.Player.State.position.pitch = buf.ReadSingle("Pitch");
        Logging.DebugPacket(this, "Player location and rotation updated");

        buf.ReadBool("On Ground Flag (dummy)");
    }
}
