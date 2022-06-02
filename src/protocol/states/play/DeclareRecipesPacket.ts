import { Console } from "../../../game/Console";
import { Client } from "../../Client";
import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class DeclareRecipesPacket implements IClientboundPacket {
    private _Client: Client;

    constructor(client: Client) {
        this._Client = client;
    }

    /**
     * Tell the client which recipes they can craft.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} RecipeCount The number of recipes to send.
     * @async
     */
    public async Write(buf: WritableBuffer): Promise<void> {
        // TODO Add recipes
        Console.Debug(`(${this._Client.ClientId})`, "[S → C]", "[DeclareRecipesPacket]", "Sending dummy recipes");
        buf.WriteVarInt(0);
    }
}