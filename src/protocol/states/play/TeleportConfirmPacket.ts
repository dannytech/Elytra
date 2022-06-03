import { Console } from "../../../game/Console";
import { Client } from "../../Client";
import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";

export class TeleportConfirmPacket extends ServerboundPacket {
    private _TeleportId: number;

    constructor(client: Client) {
        super(client);

        this._TeleportId = 0;
    }

    /**
     * Read a confirmed teleport packet.
     * @param {ReadableBuffer} buf The incoming packet buffer.
     * @property {number} TeleportId The ID of the teleport.
     * @async
     */
    public async Parse(buf: ReadableBuffer) {
        this._TeleportId = buf.ReadVarInt();
        Console.Debug(`(${this._Client.ClientId})`.magenta, "[C → S]".blue, "[TeleportConfirmPacket]".green,
            `Teleport confirmed with ID ${this._TeleportId.toString().green}`);
    }

    public async AfterReceive() {
        // Send further information like chunk lighting
    }
}
