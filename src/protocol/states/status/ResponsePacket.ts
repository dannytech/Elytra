import { Settings, MinecraftConfigs } from "../../../Configuration.js";
import { State } from "../../../State.js";
import { ClientboundPacket } from "../../Packet.js";
import { WritableBuffer } from "../../WritableBuffer.js";
import { Logging } from "../../../game/Logging.js";
import { checkVersion, VersionSpec } from "../../../Masking.js";
import { Client, ClientState } from "../../Client.js";
import { Constants } from "../../../Constants.js";
import { ChatComponentFactory } from "../../../game/chat/ChatComponentFactory.js";

export class ResponsePacket extends ClientboundPacket {
    /**
     * Send the client the server's current status
     * @param {WritableBuffer} buf The outgoing packet buffer
     * @property {string} JSONResponse A JSON object representing the current server status
     * @async
     */
    public async Write(buf: WritableBuffer) {
        const onlinePlayers: Client[] = State.Server.Clients.filter((client: Client) => client.Protocol.state === ClientState.Play && client.Player.Metadata.uuid);
        const maximumPlayers: number = Settings.Get(MinecraftConfigs.MaximumPlayers);
        const motd: string = Settings.Get(MinecraftConfigs.MOTD);

        // Either echo the protocol version if supported or tell the client to update to a newer version
        const serverVersionSpec: VersionSpec[] = Settings.Get(MinecraftConfigs.ServerVersion);
        let protocolVersion: number | undefined = this._Client.Protocol.version;
        if (!checkVersion(this._Client.Protocol.version, serverVersionSpec)) {
            const lastVersionSpec = serverVersionSpec[serverVersionSpec.length - 1];

            // Set protocol to the latest supported version
            if (lastVersionSpec.end) protocolVersion = lastVersionSpec.end;
            else protocolVersion = Constants.ProtocolVersion;
        }

        // Send back server information
        Logging.DebugPacket(this, "Sending server information");
        buf.WriteJSON({
            version: {
                name: Constants.ServerName,
                protocol: protocolVersion
            },
            players: {
                max: maximumPlayers,
                online: onlinePlayers.length,
                sample: onlinePlayers.slice(0, 5).map((client: Client) => {
                    return {
                        name: client.Player.Metadata.username,
                        id: client.Player.Metadata.uuid
                    };
                })
            },
            description: ChatComponentFactory.FromString(motd)
        }, "Server Information");
    }
}
