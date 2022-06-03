import { Console } from "../../../game/Console";
import { Client } from "../../Client";
import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class DeclareRecipesPacket extends ClientboundPacket {
    /**
     * Tell the client which recipes they can craft.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} RecipeCount The number of recipes to send.
     * @async
     */
    public async Write(buf: WritableBuffer): Promise<void> {
        // TODO Add recipes
        Console.Debug(`(${this._Client.ClientId})`.magenta, "[S → C]".blue, "[DeclareRecipesPacket]".green,
            "Sending dummy recipes");
        buf.WriteVarInt(0);
    }
}