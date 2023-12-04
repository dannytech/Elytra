import { Logging } from "../../../game/Logging.js";
import { Client } from "../../Client.js";
import { ClientboundPacket } from "../../Packet.js";
import { WritableBuffer } from "../../WritableBuffer.js";

enum UnlockRecipesAction {
    Init = 0,
    Add = 1,
    Remove = 2
}

class UnlockRecipesPacket extends ClientboundPacket {
    private _Action: UnlockRecipesAction;
    private _Displayed: string[] = [];

    constructor(client: Client, action: UnlockRecipesAction, displayed: string[] = []) {
        super(client);

        this._Action = action;
        this._Displayed = displayed;
    }

    /**
     * Tell the client to unlock recipes
     * @param {WritableBuffer} buf The outgoing packet buffer
     * @property {number} Action The action to perform
     * @property {boolean} Crafting Whether to open the recipe book in crafting tables
     * @property {boolean} CraftingFilter Whether to enable filtering in crafting tables
     * @property {boolean} Smelting Whether to open the recipe book in smelting tables
     * @property {boolean} SmeltingFilter Whether to enable filtering in smelting tables
     * @property {string[]} Displayed The recipes to display
     * @property {string[]} Recipes Addition recipes to add to the recipe book
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Whether to init, add, or remove recipes
        buf.WriteVarInt(this._Action, "Action");

        // Whether the recipe book should be open in crafting tables, and whether filtering should be enabled
        buf.WriteBool(true, "Crafting Flag");
        buf.WriteBool(true, "Crafting Filtering Flag");

        // Whether the recipe book should be open in a furnace, and whether filtering should be enabled
        buf.WriteBool(true, "Furnace Flag");
        buf.WriteBool(true, "Furnace Filtering Flag");

        // Write the recipes to display/remove
        Logging.DebugPacket(this, "Sending", this._Displayed.length.toString().green, "recipes to display");
        buf.WriteVarInt(this._Displayed.length, "Number of Displayed Recipes (dummy)");
        this._Displayed.forEach((recipe: string, recipeIndex: number) => {
            buf.WriteVarChar(recipe, `Displayed Recipe ${recipeIndex} Identifier (dummy)`);
        });

        // Add declared recipes to the client's recipe book
        if (this._Action === UnlockRecipesAction.Init) {
            const recipes: string[] = [];
            buf.WriteVarInt(recipes.length, "Number of Declared Recipes (dummy)");

            // Write all recipe identifiers known by the server
            recipes.forEach((recipe: string, recipeIndex: number) => {
                buf.WriteVarChar(recipe, `Declared Recipe ${recipeIndex} Identifier (dummy)`);
            });
        }
    }
}

export {
    UnlockRecipesAction,
    UnlockRecipesPacket
};
