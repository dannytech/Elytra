import { Console } from "../../../game/Console";
import { Client } from "../../Client";
import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class HeldItemChangePacket implements IClientboundPacket {
    private _Client: Client;
    private _Slot: number;

    constructor(client: Client, slot: number) {
        this._Client = client;
        this._Slot = slot;
    }

    /**
     * Tell the client which slot they are holding.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} Slot The slot the player is holding.
     * @async
     */
    public async Write(buf: WritableBuffer): Promise<void> {
        // Set the currently held slot
        Console.Debug(`(${this._Client.ClientId})`, "[S → C]", "[HeldItemChangePacket]", `Sending held item slot: ${this._Slot}`);
        buf.WriteByte(this._Slot);
    }
}