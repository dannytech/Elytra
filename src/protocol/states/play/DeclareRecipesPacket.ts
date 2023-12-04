import { Logging } from "../../../game/Logging.js";
import { ClientboundPacket } from "../../Packet.js";
import { WritableBuffer } from "../../WritableBuffer.js";

export class DeclareRecipesPacket extends ClientboundPacket {
    /**
     * Tell the client which recipes they can craft
     * @param {WritableBuffer} buf The outgoing packet buffer
     * @property {number} RecipeCount The number of recipes to send
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // TODO Add recipes
        Logging.DebugPacket(this, "Sending dummy recipes");
        buf.WriteVarInt(0, "Number of Recipes (dummy)");
    }
}