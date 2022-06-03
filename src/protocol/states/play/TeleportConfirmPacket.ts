import { Console } from "../../../game/Console";
import { Client } from "../../Client";
import { IServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";

export class TeleportConfirmPacket implements IServerboundPacket {
    private _Client: Client;
    private _TeleportId: number;

    constructor(client: Client) {
        this._Client = client;
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
