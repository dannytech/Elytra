import { ClientboundPacket } from "../../Packet.js";
import { WritableBuffer } from "../../WritableBuffer.js";
import { ClientState } from "../../Client.js";
import { Logging } from "../../../game/Logging.js";
import { JoinGamePacket } from "../play/JoinGamePacket.js";
import { Constants } from "../../../Constants.js";
import { ServerPluginMessagePacket } from "../play/ServerPluginMessagePacket.js";
import { HeldItemChangePacket } from "../play/HeldItemChangePacket.js";
import { DeclareRecipesPacket } from "../play/DeclareRecipesPacket.js";
import { TagsPacket } from "../play/TagsPacket.js";
import { EntityStatus, EntityStatusPacket } from "../play/EntityStatusPacket.js";
import { DeclareCommandsPacket } from "../play/DeclareCommandsPacket.js";
import { UnlockRecipesAction, UnlockRecipesPacket } from "../play/UnlockRecipesPacket.js";
import { PlayerPositionAndLookPacket } from "../play/PlayerPositionAndLookPacket.js";

export class LoginSuccessPacket extends ClientboundPacket {
    /**
     * Tell the client that the login process was successful
     * @param {WritableBuffer} buf The outgoing packet buffer
     * @property {string} UUID The player's UUID
     * @property {string} Username The player's username
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Write the player UUID
        const uuid: string = this._Client.Player.Metadata.uuid.Format(true);
        Logging.DebugPacket(this, "Sending player UUID", uuid.green);
        buf.WriteVarChar(uuid, "Player UUID");

        // Write the username
        buf.WriteVarChar(this._Client.Player.Metadata.username, "Player Username");
    }

    /**
     * Switch to the play state and send join game packets
     * @async
     */
    public async AfterSend() {
        // Update the client's state
        Logging.DebugPacket(this, "Switching to state", "play".green);
        this._Client.Protocol.state = ClientState.Play;

        // Queue some more joining packets
        Logging.DebugPacket(this, "Queueing initial play state packets");
        this._Client.Queue(new JoinGamePacket(this._Client));

        // Send the server brand
        const pluginMessage: WritableBuffer = new WritableBuffer();
        pluginMessage.WriteVarChar(Constants.ServerName);
        this._Client.Queue(new ServerPluginMessagePacket(this._Client, "minecraft:brand", pluginMessage.Buffer));

        // Send the current server/last player state to the client
        this._Client.Queue(new HeldItemChangePacket(this._Client, 0));
        this._Client.Queue(new DeclareRecipesPacket(this._Client));
        this._Client.Queue(new TagsPacket(this._Client));
        this._Client.Queue(new EntityStatusPacket(this._Client, this._Client.Player.EntityID, EntityStatus.PlayerPermissionsLevel0 + this._Client.Player.State.op));
        this._Client.Queue(new DeclareCommandsPacket(this._Client));
        this._Client.Queue(new UnlockRecipesPacket(this._Client, UnlockRecipesAction.Init));
        this._Client.Queue(new PlayerPositionAndLookPacket(this._Client, this._Client.Player.State.position));
    }
}
