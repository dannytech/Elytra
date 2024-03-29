import { ClientboundPacket } from "../../Packet.js";
import { WritableBuffer } from "../../WritableBuffer.js";
import { Settings, MinecraftConfigs } from "../../../Configuration.js";
import { State } from "../../../State.js";
import { Logging } from "../../../game/Logging.js";

export class JoinGamePacket extends ClientboundPacket {
    /**
     * Tell the client their game status
     * @param {WritableBuffer} buf The outgoing packet buffer
     * @property {number} EntityID The player's entity ID
     * @property {number} Gamemode The player's current gamemode
     * @property {number} Dimension The dimension the player is in
     * @property {bigint} HashedSeed A hash of the server's seed
     * @property {number} MaxPlayers The server player cap, ignored and not calculated
     * @property {string} LevelType The world generator used
     * @property {number} ViewDistance The server's support view distance
     * @property {boolean} ReducedDebugInfo Whether to suppress debug information
     * @property {boolean} EnableRespawnScreen Whether to bypass the respawn screen
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Player entity ID
        Logging.DebugPacket(this, "Requesting player entity", this._Client.Player.EntityID.toString().green, "to join");
        buf.WriteInt32(this._Client.Player.EntityID, "Entity ID");

        // Gamemode
        buf.WriteByte(this._Client.Player.State.gamemode, "Gamemode");

        // Dimension
        buf.WriteInt32(0, "Dimension"); // TODO Determine the actual dimension ID and send it back

        // Send a fake seed hash to prevent any possibility of reversing
        const seedHash = BigInt(0);
        buf.WriteInt64(seedHash, "Seed Hash (dummy)");

        // Write the maximum number of players (this is ignored)
        buf.WriteByte(0, "Maximum Players (ignored)");

        // Level type
        buf.WriteVarChar(State.Worlds.get(this._Client.Player.State.position.world).Metadata.generator, "Level Type");

        // View distance
        const renderDistance: number = Settings.Get(MinecraftConfigs.RenderDistance);
        buf.WriteVarInt(renderDistance, "Render Distance");

        // Reduced debug info
        const reducedDebug: boolean = Settings.Get(MinecraftConfigs.ReducedDebug);
        buf.WriteBool(reducedDebug, "Reduced Debug Flag");

        // Enable respawn screen
        const respawnScreen: boolean = Settings.Get(MinecraftConfigs.RespawnScreen);
        buf.WriteBool(respawnScreen, "Respawn Screen Flag");
    }
}
