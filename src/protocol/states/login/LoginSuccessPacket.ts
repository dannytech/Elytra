import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { Client, ClientState } from "../../Client";
import { UUID } from "../../../game/UUID";
import { Console } from "../../../game/Console";
import { JoinGamePacket } from "../play/JoinGamePacket";
import { Constants } from "../../../Configuration";
import { ServerPluginMessagePacket } from "../play/PluginMessagePacket";
import { HeldItemChangePacket } from "../play/HeldItemChangePacket";
import { DeclareRecipesPacket } from "../play/DeclareRecipesPacket";
import { TagsPacket } from "../play/TagsPacket";
import { EntityStatus, EntityStatusPacket } from "../play/EntityStatusPacket";
import { DeclareCommandsPacket } from "../play/DeclareCommandsPacket";
import { UnlockRecipesAction, UnlockRecipesPacket } from "../play/UnlockRecipesPacket";

export class LoginSuccessPacket implements IClientboundPacket {
    private _Client: Client;

    public PacketID: number = 0x02;

    constructor(client: Client) {
        this._Client = client;
    }

    /**
     * Tell the client that the login process was successful.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {string} UUID The player's UUID.
     * @property {string} Username The player's username.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Write the player UUID
        Console.Debug(`(${this._Client.ClientId})`, "[S → C]", "[LoginSuccessPacket]", "Sending logged-in UUID");
        const uuid: UUID = this._Client.Player.UUID || UUID.Generate();
        buf.WriteVarChar(uuid.Format(true));

        // Write the username
        buf.WriteVarChar(this._Client.Player.Username);

        // Update the client's state
        Console.Debug(`(${this._Client.ClientId})`, "[S → C]", "[LoginSuccessPacket]", "Switching to state: Play");
        this._Client.State = ClientState.Play;

        // Queue some more joining packets
        Console.Debug(`(${this._Client.ClientId})`, "[S → C]", "[LoginSuccessPacket]", "Queueing initial play state packets");
        this._Client.Queue(new JoinGamePacket(this._Client));

        // Send the server brand
        const pluginMessage: WritableBuffer = new WritableBuffer();
        pluginMessage.WriteVarChar(Constants.ServerName);
        this._Client.Queue(new ServerPluginMessagePacket(this._Client, "minecraft:brand", pluginMessage.Buffer));

        // Send the current server/last player state to the client
        this._Client.Queue(new HeldItemChangePacket(this._Client, 0));
        this._Client.Queue(new DeclareRecipesPacket(this._Client));
        this._Client.Queue(new TagsPacket(this._Client));
        this._Client.Queue(new EntityStatusPacket(this._Client, this._Client.Player.EntityID, EntityStatus.PlayerPermissionsLevel0 + this._Client.Player.Op));
        this._Client.Queue(new DeclareCommandsPacket(this._Client));
        this._Client.Queue(new UnlockRecipesPacket(this._Client, UnlockRecipesAction.Init));
    }
}
