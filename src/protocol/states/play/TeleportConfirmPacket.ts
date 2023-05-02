import { State } from "../../../Configuration";
import { Console } from "../../../game/Console";
import { Client, ClientState } from "../../Client";
import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { PlayerInfoActions, PlayerInfoPacket } from "./PlayerInfoPacket";
import { UpdateLightPacket } from "./UpdateLightPacket";
import { UpdateViewPositionPacket } from "./UpdateViewPositionPacket";

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
        this._TeleportId = buf.ReadVarInt();
        Console.DebugPacket(this, "Teleport confirmed with ID", this._TeleportId.toString().green);
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
