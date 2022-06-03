import { Console } from "../../../game/Console";
import { Player, PlayerProperty } from "../../../game/Player";
import { Client } from "../../Client";
import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export enum PlayerInfoActions {
    AddPlayer = 0,
    UpdateGamemode = 1,
    UpdateLatency = 2,
    UpdateDisplayName = 3,
    RemovePlayer = 4
}

export class PlayerInfoPacket extends ClientboundPacket {
    private _Action: PlayerInfoActions;
    private _Players: Player[];

    constructor(client: Client, action: PlayerInfoActions, players: Player[]) {
        super(client);

        this._Action = action;
        this._Players = players;
    }

    /**
     * Send information about players on the server to the client.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {PlayerInfoActions} Action The action to perform.
     * @property {Player[]} Players The players to send information about.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Player action
        buf.WriteVarInt(this._Action);

        // List of players
        Console.DebugPacket(this, "Sending", PlayerInfoActions[this._Action].green, "player information for", this._Players.length.toString().blue, "player(s)");
        buf.WriteVarInt(this._Players.length);
        this._Players.forEach((player: Player) => {
            // Write each player UUID
            buf.WriteUUID(player.UUID);

            switch(this._Action) {
                case PlayerInfoActions.AddPlayer:
                    buf.WriteVarChar(player.Username);

                    // Write player properties such as skin and cape
                    buf.WriteVarInt(player.Properties.length);
                    player.Properties.forEach((property: PlayerProperty) => {
                        buf.WriteVarChar(property.name);
                        buf.WriteVarChar(property.value);

                        // Optional Mojang signature, for example for capes
                        if (property.signature) {
                            buf.WriteBool(true);
                            buf.WriteVarChar(property.signature);
                        } else buf.WriteBool(false);
                    });

                    // Write the gamemode
                    buf.WriteVarInt(player.Gamemode);

                    // Write the current player latency
                    buf.WriteVarInt(player.Latency || -1);

                    // Indicates whether the player has a custom nickname
                    buf.WriteBool(false);
                    // TODO Add nickname support (using chat components)

                    break;
                case PlayerInfoActions.UpdateGamemode:
                    // Send a gamemode update for a player
                    buf.WriteVarInt(player.Gamemode);
                    break;
                case PlayerInfoActions.UpdateLatency:
                    // Send a latency update for a player
                    buf.WriteVarInt(player.Latency || -1);
                    break;
                case PlayerInfoActions.UpdateDisplayName:
                    buf.WriteBool(false);
                    // TODO Add display name support (using chat components)
                    break;
            }
        });
    }
}