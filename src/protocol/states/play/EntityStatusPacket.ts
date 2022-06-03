import { Console } from "../../../game/Console";
import { Client } from "../../Client";
import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export enum EntityStatus {
    PlayerItemUseFinished = 9,
    PlayerEnableReducedDebug = 22,
    PlayerDisableReducedDebug = 23,
    PlayerPermissionsLevel0 = 24,
    PlayerPermissionsLevel1 = 25,
    PlayerPermissionsLevel2 = 26,
    PlayerPermissionsLevel3 = 27,
    PlayerPermissionsLevel4 = 28
}

export class EntityStatusPacket extends ClientboundPacket {
    private _EntityId: number;
    private _Status: number;

    constructor(client: Client, entityId: number, status: EntityStatus) {
        super(client);

        this._EntityId = entityId;
        this._Status = status;
    }

    /**
     * Update a client entity in some way.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} EntityId The entity ID to update.
     * @property {number} Status The status to update the entity with.
     */
    public async Write(buf: WritableBuffer) {
        Console.DebugPacket(this, "Sending entity status", EntityStatus[this._Status].green, "for entity", this._EntityId.toString().blue);
        buf.WriteInt32(this._EntityId);
        buf.WriteByte(this._Status);
    }
}