import { Console } from "../../../game/Console";
import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class DeclareRecipesPacket extends ClientboundPacket {
    /**
     * Tell the client which recipes they can craft.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} RecipeCount The number of recipes to send.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // TODO Add recipes
        Console.DebugPacket(this, "Sending dummy recipes");
        buf.WriteVarInt(0);
    }
}