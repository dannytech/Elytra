import { Logging } from "../../../game/Logging.js";
import { Client } from "../../Client.js";
import { ClientboundPacket } from "../../Packet.js";
import { WritableBuffer } from "../../WritableBuffer.js";

export class HeldItemChangePacket extends ClientboundPacket {
    private _Slot: number;

    constructor(client: Client, slot: number) {
        super(client);

        this._Client = client;
        this._Slot = slot;
    }

    /**
     * Tell the client which slot they are holding
     * @param {WritableBuffer} buf The outgoing packet buffer
     * @property {number} Slot The slot the player is holding
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Set the currently held slot
        Logging.DebugPacket(this, "Sending held item slot", this._Slot.toString().green);
        buf.WriteByte(this._Slot, "Slot Number");
    }
}