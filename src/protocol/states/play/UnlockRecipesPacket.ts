import { Console } from "../../../game/Console";
import { Client } from "../../Client";
import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export enum UnlockRecipesAction {
    Init = 0,
    Add = 1,
    Remove = 2
}

export class UnlockRecipesPacket implements IClientboundPacket {
    private _Client: Client;
    private _State: UnlockRecipesAction;
    private _Displayed: string[] = [];

    constructor(client: Client, action: UnlockRecipesAction, displayed: string[] = []) {
        this._Client = client;
        this._State = action;
        this._Displayed = displayed;
    }

    /**
     * Tell the client to unlock recipes.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} Action The action to perform.
     * @property {boolean} Crafting Whether to open the recipe book in crafting tables.
     * @property {boolean} CraftingFilter Whether to enable filtering in crafting tables.
     * @property {boolean} Smelting Whether to open the recipe book in smelting tables.
     * @property {boolean} SmeltingFilter Whether to enable filtering in smelting tables.
     * @property {string[]} Displayed The recipes to display.
     * @property {string[]} Recipes Addition recipes to add to the recipe book.
     * @async
     */
    public async Write(buf: WritableBuffer): Promise<void> {
        // Whether to init, add, or remove recipes
        buf.WriteVarInt(this._State);

        // Whether the recipe book should be open in crafting tables, and whether filtering should be enabled
        buf.WriteBool(true);
        buf.WriteBool(true);

        // Whether the recipe book should be open in a furnace, and whether filtering should be enabled
        buf.WriteBool(true);
        buf.WriteBool(true);

        // Write the recipes to display/remove
        Console.Debug(`(${this._Client.ClientId})`.magenta, "[S → C]".blue, "[UnlockRecipesPacket]".green,
            `Sending ${this._Displayed.length.toString().green} recipes to display`);
        buf.WriteVarInt(this._Displayed.length);
        this._Displayed.forEach((recipe: string) => {
            buf.WriteVarChar(recipe);
        });

        // Add declared recipes to the client's recipe book
        if (this._State === UnlockRecipesAction.Init) {
            const recipes: string[] = [];
            buf.WriteVarInt(recipes.length);

            // Write all recipe identifiers known by the server
            recipes.forEach((recipe: string) => {
                buf.WriteVarChar(recipe);
            });
        }
    }
}