import { Console } from "../../../game/Console";
import { Client } from "../../Client";
import { IClientboundPacket } from "../../Packet";
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

export class EntityStatusPacket implements IClientboundPacket {
    private _Client: Client;
    private _EntityId: number;
    private _Status: number;

    public PacketID: number = 0x1C;

    constructor(client: Client, entityId: number, status: EntityStatus) {
        this._Client = client;
        this._EntityId = entityId;
        this._Status = status;
    }

    /**
     * Update a client entity in some way.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} EntityId The entity ID to update.
     * @property {number} Status The status to update the entity with.
     */
    public async Write(buf: WritableBuffer): Promise<void> {
        Console.Debug(`(${this._Client.ClientId})`, "[S → C]", "[EntityStatusPacket]", `Sending entity status: ${EntityStatus[this._Status]}`);
        buf.WriteInt32(this._EntityId);
        buf.WriteByte(this._Status);
    }
}