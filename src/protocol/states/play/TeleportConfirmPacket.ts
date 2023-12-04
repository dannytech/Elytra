import { State } from "../../../State.js";
import { Logging } from "../../../game/Logging.js";
import { Client, ClientState } from "../../Client.js";
import { ServerboundPacket } from "../../Packet.js";
import { ReadableBuffer } from "../../ReadableBuffer.js";
import { PlayerInfoActions, PlayerInfoPacket } from "./PlayerInfoPacket.js";
import { UpdateLightPacket } from "./UpdateLightPacket.js";
import { UpdateViewPositionPacket } from "./UpdateViewPositionPacket.js";

export class TeleportConfirmPacket extends ServerboundPacket {
    private _TeleportId: number;

    constructor(client: Client) {
        super(client);

        this._TeleportId = 0;
    }

    /**
     * Read a confirmed teleport packet
     * @param {ReadableBuffer} buf The incoming packet buffer
     * @property {number} TeleportId The ID of the teleport
     * @async
     */
    public async Parse(buf: ReadableBuffer) {
        this._TeleportId = buf.ReadVarInt("Teleport ID");
        Logging.DebugPacket(this, "Teleport confirmed with ID", this._TeleportId.toString().green);
    }

    public async AfterReceive() {
        // Filter all the online players
        const onlinePlayers: Client[] = State.Server.Clients.filter((client: Client) => client.Protocol.state === ClientState.Play && client.Player.Metadata.uuid);

        // Send further information like chunk lighting
        this._Client.Queue(new PlayerInfoPacket(this._Client, PlayerInfoActions.AddPlayer, onlinePlayers));
        this._Client.Queue(new UpdateViewPositionPacket(this._Client));
        this._Client.Queue(new UpdateLightPacket(this._Client, {
            x: Math.floor(this._Client.Player.State.position.x / 16),
            y: Math.floor(this._Client.Player.State.position.y / 16),
            world: this._Client.Player.State.position.world
        }));
    }
}
