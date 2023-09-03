import { Logging } from "../../../game/Logging";
import { PlayerProperty } from "../../../game/Player";
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
    private _Clients: Client[];

    constructor(client: Client, action: PlayerInfoActions, clients: Client[]) {
        super(client);

        this._Action = action;
        this._Clients = clients;
    }

    /**
     * Send information about players on the server to the client
     * @param {WritableBuffer} buf The outgoing packet buffer
     * @property {PlayerInfoActions} Action The action to perform
     * @property {Player[]} Players The players to send information about
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Player action
        buf.WriteVarInt(this._Action, "Action");

        // List of players
        Logging.DebugPacket(this, "Sending", PlayerInfoActions[this._Action].green, "player information for", this._Clients.length.toString().blue, "player(s)");
        buf.WriteVarInt(this._Clients.length, "Number of Players");
        this._Clients.forEach((client: Client, clientIndex: number) => {
            // Write each player UUID
            buf.WriteUUID(client.Player.Metadata.uuid, `Player ${clientIndex} UUID`);

            switch(this._Action) {
                case PlayerInfoActions.AddPlayer:
                    buf.WriteVarChar(client.Player.Metadata.username, `Player ${clientIndex} Username`);

                    // Write player properties such as skin and cape
                    buf.WriteVarInt(client.Player.Metadata.properties.length, `Number of Player ${clientIndex} Properties`);
                    client.Player.Metadata.properties.forEach((property: PlayerProperty, propertyIndex: number) => {
                        buf.WriteVarChar(property.name, `Player ${clientIndex} Property ${propertyIndex} Name`);
                        buf.WriteVarChar(property.value, `Player ${clientIndex} Property ${propertyIndex} Value`);

                        // Optional Mojang signature, for example for capes
                        const signature = property.signature != null;
                        buf.WriteBool(signature, `Player ${clientIndex} Property ${propertyIndex} Signature Flag`);
                        if (signature)
                            buf.WriteVarChar(property.signature, `Player ${clientIndex} Property ${propertyIndex} Signature`);
                    });

                    // Write the gamemode
                    buf.WriteVarInt(client.Player.State.gamemode, `Player ${clientIndex} Gamemode`);

                    // Write the current player latency
                    buf.WriteVarInt(client.Protocol.latency, `Player ${clientIndex} Latency`);

                    // Indicates whether the player has a custom nickname
                    buf.WriteBool(false, `Player ${clientIndex} Nickname Flag`);
                    // TODO Add nickname support (using chat components)

                    break;
                case PlayerInfoActions.UpdateGamemode:
                    // Send a gamemode update for a player
                    buf.WriteVarInt(client.Player.State.gamemode, `Player ${clientIndex} Gamemode`);
                    break;
                case PlayerInfoActions.UpdateLatency:
                    // Send a latency update for a player
                    buf.WriteVarInt(client.Protocol.latency, `Player ${clientIndex} Latency`);
                    break;
                case PlayerInfoActions.UpdateDisplayName:
                    buf.WriteBool(false, `Player ${clientIndex} Nickname Flag`);
                    // TODO Add display name support (using chat components)
                    break;
            }
        });
    }
}