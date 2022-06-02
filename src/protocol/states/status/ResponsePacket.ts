import { Settings, Constants, State, MinecraftConfigs } from "../../../Configuration";
import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { Client } from "../../Client";
import { ChatComponentFactory } from "../../../game/chat/ChatComponentFactory";
import { Console } from "../../../game/Console";

export class ResponsePacket implements IClientboundPacket {
    private _Client: Client;
    public PacketID: number = 0x00;

    constructor(client: Client) {
        this._Client = client;
    }

    /**
     * Send the client the server's current status.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {string} JSONResponse A JSON object representing the current server status.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        const onlinePlayers: Client[] = State.ClientBus.Clients.filter((client: Client) => client.Player?.UUID);
        const maximumPlayers: number = await Settings.Get(MinecraftConfigs.MaximumPlayers);
        const motd: string = await Settings.Get(MinecraftConfigs.MOTD);

        // Send back server information
        Console.Debug(`(${this._Client.ClientId})`, "[S → C]", "[ResponsePacket]", "Sending server list information");
        buf.WriteJSON({
            version: {
                name: `${Constants.ServerName} ${Constants.MinecraftVersion}`,
                protocol: Constants.ProtocolVersion
            },
            players: {
                max: maximumPlayers,
                online: onlinePlayers.length,
                sample: onlinePlayers.slice(0, 5).map((client: Client) => {
                    return {
                        name: client.Player.Username,
                        id: client.Player.UUID
                    };
                })
            },
            description: ChatComponentFactory.FromFormattedString(motd)
        });
    }
}
