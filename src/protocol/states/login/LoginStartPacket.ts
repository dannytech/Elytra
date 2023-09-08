import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { SetCompressionPacket } from "./SetCompressionPacket";
import { Player } from "../../../game/Player";
import { LoginSuccessPacket } from "./LoginSuccessPacket";
import { EncryptionRequestPacket } from "./EncryptionRequestPacket";
import { Settings, MinecraftConfigs } from "../../../Configuration";
import { Logging } from "../../../game/Logging";
import { UUID } from "../../../game/UUID";
import * as crypto from "crypto";

export class LoginStartPacket extends ServerboundPacket {
    /**
     * Parse requests to begin the login process
     * @param {ReadableBuffer} buf The incoming packet buffer
     * @property {string} Name The player's username
     * @async
     */
    public async Parse(buf: ReadableBuffer) {
        const username: string = buf.ReadVarChar("Username");

        // Create an unauthenticated player object (which will remain if offline mode is enabled)
        this._Client.Player = new Player(username);

        const online: boolean = Settings.Get(MinecraftConfigs.Online);
        if (online) {
            // Begin the encryption/authentication process
            Logging.DebugPacket(this, "Beginning encryption/authentication process");
            this._Client.Queue(new EncryptionRequestPacket(this._Client));
        } else {
            Logging.Warn("Online mode is off, allowing alleged player", this._Client.Player.Metadata.username.green, "to connect");

            // Prepare the player to join
            const compressionThreshold: number = Settings.Get(MinecraftConfigs.CompressionThreshold);
            if (compressionThreshold > -1)
                this._Client.Queue(new SetCompressionPacket(this._Client));

            // Calculate and truncate the SHA-256 hash of the username to determine the player UUID
            const hash: Buffer = crypto.createHash("sha256").update(this._Client.Player.Metadata.username).digest();
            this._Client.Player.Metadata.uuid = new UUID(hash.slice(0, 16));

            Logging.DebugPacket(this, "Offline player", this._Client.Player.Metadata.username, "logging in with UUID", this._Client.Player.Metadata.uuid);
            this._Client.Queue(new LoginSuccessPacket(this._Client));
        }
    }
}
