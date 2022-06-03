import { Console } from "../../../game/Console";
import { PlayerPositionAndLook } from "../../../game/Player";
import { Client } from "../../Client";
import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export enum PlayerPositionAndLookFlags {
    XRelative = 0x01,
    YRelative = 0x02,
    ZRelative = 0x04,
    YawRelative = 0x08,
    PitchRelative = 0x10
}

export class PlayerPositionAndLookPacket implements IClientboundPacket {
    private _Client: Client;
    private _PositionAndLook: PlayerPositionAndLook;
    private _Flags: PlayerPositionAndLookFlags;

    constructor(client: Client, positionAndLook: PlayerPositionAndLook, flags: PlayerPositionAndLookFlags = 0x00) {
        this._Client = client;
        this._PositionAndLook = positionAndLook;
        this._Flags = flags;
    }

    /**
     * Tell the client to move to a new position and look.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} X The X coordinate to move to.
     * @property {number} Y The Y coordinate to move to.
     * @property {number} Z The Z coordinate to move to.
     * @property {number} Yaw The Yaw to look at.
     * @property {number} Pitch The Pitch to look at.
     * @property {number} Flags Flags for the packet.
     * @property {number} TeleportId The teleport ID, to be confirmed later.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Writes the player position and look
        buf.WriteDouble(this._PositionAndLook.x);
        buf.WriteDouble(this._PositionAndLook.y);
        buf.WriteDouble(this._PositionAndLook.z);
        buf.WriteSingle(this._PositionAndLook.yaw);
        buf.WriteSingle(this._PositionAndLook.pitch);

        // Which values should be treated as relative
        buf.WriteByte(this._Flags);

        // Teleport ID (dummy value)
        Console.Debug(`(${this._Client.ClientId})`.magenta, "[S → C]".blue, "[PlayerPositionAndLookPacket]".green,
            "Sending position/look and teleport request");
        buf.WriteVarInt(0);
    }
}