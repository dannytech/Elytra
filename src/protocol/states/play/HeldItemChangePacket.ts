import { Console } from "../../../game/Console";
import { Client } from "../../Client";
import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class HeldItemChangePacket extends ClientboundPacket {
    private _Slot: number;

    constructor(client: Client, slot: number) {
        super(client);

        this._Client = client;
        this._Slot = slot;
    }

    /**
     * Tell the client which slot they are holding.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} Slot The slot the player is holding.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Set the currently held slot
        Console.DebugPacket(this, "Sending held item slot", this._Slot.toString().green);
        buf.WriteByte(this._Slot);
    }
}