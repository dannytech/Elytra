import { Logging } from "../../../game/Logging.js";
import { EntityPositionAndLook } from "../../../game/Entity.js";
import { Client } from "../../Client.js";
import { ClientboundPacket } from "../../Packet.js";
import { WritableBuffer } from "../../WritableBuffer.js";

export enum PlayerPositionAndLookFlags {
    None = 0x00,
    XRelative = 0x01,
    YRelative = 0x02,
    ZRelative = 0x04,
    YawRelative = 0x08,
    PitchRelative = 0x10
}

export class PlayerPositionAndLookPacket extends ClientboundPacket {
    private _PositionAndLook: EntityPositionAndLook;
    private _Flags: PlayerPositionAndLookFlags;

    constructor(client: Client, positionAndLook: EntityPositionAndLook, flags: PlayerPositionAndLookFlags = 0x00) {
        super(client);

        this._PositionAndLook = positionAndLook;
        this._Flags = flags;
    }

    /**
     * Tell the client to move to a new position and look
     * @param {WritableBuffer} buf The outgoing packet buffer
     * @property {number} X The X coordinate to move to
     * @property {number} Y The Y coordinate to move to
     * @property {number} Z The Z coordinate to move to
     * @property {number} Yaw The Yaw to look at
     * @property {number} Pitch The Pitch to look at
     * @property {number} Flags Flags for the packet
     * @property {number} TeleportId The teleport ID, to be confirmed later
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Writes the player position and look
        buf.WriteDouble(this._PositionAndLook.x, "X");
        buf.WriteDouble(this._PositionAndLook.y, "Y");
        buf.WriteDouble(this._PositionAndLook.z, "Z");
        buf.WriteSingle(this._PositionAndLook.yaw, "Yaw");
        buf.WriteSingle(this._PositionAndLook.pitch, "Pitch");

        // Which values should be treated as relative
        buf.WriteByte(this._Flags, "Relative Flags");

        // Teleport ID (dummy value)
        Logging.DebugPacket(this, "Sending position/look and teleport request");
        buf.WriteVarInt(0, "Teleport ID (dummy)");
    }
}