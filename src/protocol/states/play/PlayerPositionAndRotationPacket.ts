import { Console } from "../../../game/Console";
import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";

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
        this._Client.Player.State.position.x = buf.ReadDouble();
        this._Client.Player.State.position.y = buf.ReadDouble();
        this._Client.Player.State.position.z = buf.ReadDouble();
        this._Client.Player.State.position.yaw = buf.ReadSingle();
        this._Client.Player.State.position.pitch = buf.ReadSingle();
        Console.DebugPacket(this, "Player location and rotation updated to", ...Object.values(this._Client.Player.State.position));

        buf.ReadBool(); // onground
    }
}
