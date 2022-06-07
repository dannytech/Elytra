import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { State, Settings, MinecraftConfigs } from "../../../Configuration";
import { Console } from "../../../game/Console";

export class JoinGamePacket extends ClientboundPacket {
    /**
     * Tell the client their game status.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} EntityID The player's entity ID.
     * @property {number} Gamemode The player's current gamemode.
     * @property {number} Dimension The dimension the player is in.
     * @property {bigint} HashedSeed A hash of the server's seed.
     * @property {number} MaxPlayers The server player cap, ignored and not calculated.
     * @property {string} LevelType The world generator used.
     * @property {number} ViewDistance The server's support view distance.
     * @property {boolean} ReducedDebugInfo Whether to suppress debug information.
     * @property {boolean} EnableRespawnScreen Whether to bypass the respawn screen.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Player entity ID
        Console.DebugPacket(this, "Requesting player entity", this._Client.Player.EntityID.toString().green, "to join");
        buf.WriteInt32(this._Client.Player.EntityID);

        // Gamemode
        buf.WriteByte(this._Client.Player.State.gamemode);

        // Dimension
        buf.WriteInt32(0); // TODO Determine the actual dimension ID and send it back

        // Send a fake seed hash to prevent any possibility of reversing
        const seedHash = BigInt(0);
        buf.WriteInt64(seedHash);

        // Write the maximum number of players (this is ignored)
        buf.WriteByte(0);

        // Level type
        buf.WriteVarChar(State.World.Generator);

        // View distance
        const renderDistance: number = await Settings.Get(MinecraftConfigs.RenderDistance);
        buf.WriteVarInt(renderDistance);

        // Reduced debug info
        const reducedDebug: boolean = await Settings.Get(MinecraftConfigs.ReducedDebug);
        buf.WriteBool(reducedDebug);

        // Enable respawn screen
        const respawnScreen: boolean = await Settings.Get(MinecraftConfigs.RespawnScreen);
        buf.WriteBool(respawnScreen);
    }
}
