import * as crypto from "crypto";

import { ServerboundPacket } from "../../Packet.js";
import { ReadableBuffer } from "../../ReadableBuffer.js";
import { SetCompressionPacket } from "./SetCompressionPacket.js";
import { Player } from "../../../game/Player.js";
import { LoginSuccessPacket } from "./LoginSuccessPacket.js";
import { EncryptionRequestPacket } from "./EncryptionRequestPacket.js";
import { Settings, MinecraftConfigs } from "../../../Configuration.js";
import { Logging } from "../../../game/Logging.js";
import { UUID } from "../../../game/UUID.js";

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

            // Set up proxy to save values on change
            this._Client.Player.Save();
            this._Client.Player = Player.Mapper.proxy(this._Client.Player);

            Logging.DebugPacket(this, "Offline player", this._Client.Player.Metadata.username.green, "logging in with UUID", this._Client.Player.Metadata.uuid.Format(true).blue);
            this._Client.Queue(new LoginSuccessPacket(this._Client));
        }
    }
}
