import { State } from "../../../Configuration";
import { Console } from "../../../game/Console";
import { Player } from "../../../game/Player";
import { Client } from "../../Client";
import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { PlayerInfoActions, PlayerInfoPacket } from "./PlayerInfoPacket";

export class TeleportConfirmPacket extends ServerboundPacket {
    private _TeleportId: number;

    constructor(client: Client) {
        super(client);

        this._TeleportId = 0;
    }

    /**
     * Read a confirmed teleport packet.
     * @param {ReadableBuffer} buf The incoming packet buffer.
     * @property {number} TeleportId The ID of the teleport.
     * @async
     */
    public async Parse(buf: ReadableBuffer) {
        this._TeleportId = buf.ReadVarInt();
        Console.DebugPacket(this, "Teleport confirmed with ID", this._TeleportId.toString().green);
    }

    public async AfterReceive() {
        // Filter all the online players
        const onlinePlayers: Player[] = State.ClientBus.Clients.reduce((players: Player[], client: Client) => {
            if (client.Player) players.push(client.Player);
            return players;
        }, []);

        // Send further information like chunk lighting
        this._Client.Queue(new PlayerInfoPacket(this._Client, PlayerInfoActions.AddPlayer, onlinePlayers));
    }
}
