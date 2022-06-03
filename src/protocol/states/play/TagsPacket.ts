import { Console } from "../../../game/Console";
import { Client } from "../../Client";
import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class TagsPacket implements IClientboundPacket {
    private _Client: Client;

    constructor(client: Client) {
        this._Client = client;
    }

    /**
     * Tell the client all the identifiers for the tags they can use.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} BlockTags An array of block identifiers.
     * @property {number} ItemTags An array of item identifiers.
     * @property {number} FluidTags An array of fluid identifiers.
     * @property {number} EntityTags An array of entity identifiers.
     * @async
     */
    public async Write(buf: WritableBuffer): Promise<void> {
        // TODO Add tags
        Console.Debug(`(${this._Client.ClientId})`.magenta, "[S → C]".blue, "[TagsPacket]".green,
            "Sending dummy tags");
        buf.WriteVarInt(0); // Block tags
        buf.WriteVarInt(0); // Item tags
        buf.WriteVarInt(0); // Fluid tags
        buf.WriteVarInt(0); // Entity tags
    }
}