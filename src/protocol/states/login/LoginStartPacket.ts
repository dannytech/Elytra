import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { SetCompressionPacket } from "./SetCompressionPacket";
import { Player } from "../../../game/Player";
import { LoginSuccessPacket } from "./LoginSuccessPacket";
import { EncryptionRequestPacket } from "./EncryptionRequestPacket";
import { Settings, MinecraftConfigs } from "../../../Configuration";
import { Logging } from "../../../game/Logging";
import { UUID } from "../../../game/UUID";

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
            const allowCompression: boolean = Settings.Get(MinecraftConfigs.AllowCompression);
            if (allowCompression)
                this._Client.Queue(new SetCompressionPacket(this._Client));

            // Generate a random UUID to utilize for this session
            this._Client.Player.Metadata.uuid = UUID.Generate();

            Logging.DebugPacket(this, "Bypassing login due to offline mode");
            this._Client.Queue(new LoginSuccessPacket(this._Client));
        }
    }
}
