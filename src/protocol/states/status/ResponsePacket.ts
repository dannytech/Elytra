import { Settings, Constants, State, MinecraftConfigs } from "../../../Configuration";
import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { Client } from "../../Client";

export class ResponsePacket implements IClientboundPacket {
    public PacketID: number = 0x00;

    /**
     * Send the client the server's current status.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {string} JSONResponse A JSON object representing the current server status.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        const onlinePlayers: Client[] = State.ClientBus.Clients.filter((client: Client) => client.Player && client.Player.UUID);
        const maximumPlayers: number = await Settings.Get(MinecraftConfigs.MaximumPlayers);
        const motd: string = await Settings.Get(MinecraftConfigs.MOTD);

        // Send back server information
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
            description: {
                text: motd
            }
        });
    }
}
