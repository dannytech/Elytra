import { Settings, Constants, State, MinecraftConfigs } from "../../../Configuration";
import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { Client } from "../../Client";
import { ChatComponentFactory } from "../../../game/chat/ChatComponentFactory";
import { Console } from "../../../game/Console";
import { checkVersion, VersionSpec } from "../../../Masking";

export class ResponsePacket implements IClientboundPacket {
    private _Client: Client;

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

        // Either echo the protocol version if supported or tell the client to update to a newer version
        const serverVersionSpec: VersionSpec[] = await Settings.Get(MinecraftConfigs.ServerVersion);
        let protocolVersion: number = this._Client.ProtocolVersion;
        if (!checkVersion(this._Client.ProtocolVersion, serverVersionSpec)) {
            const lastVersionSpec = serverVersionSpec[serverVersionSpec.length - 1];

            // Set protocol to the latest supported version
            if (lastVersionSpec.end) protocolVersion = lastVersionSpec.end;
            else protocolVersion = Constants.ProtocolVersion;
        }

        // Send back server information
        Console.Debug(`(${this._Client.ClientId})`.magenta, "[S → C]".blue, "[ResponsePacket]".green,
            "Sending server list information");
        buf.WriteJSON({
            version: {
                name: `${Constants.ServerName}`,
                protocol: protocolVersion
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
