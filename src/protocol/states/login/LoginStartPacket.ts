import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { SetCompressionPacket } from "./SetCompressionPacket";
import { Player } from "../../../game/Player";
import { LoginSuccessPacket } from "./LoginSuccessPacket";
import { EncryptionRequestPacket } from "./EncryptionRequestPacket";
import { Settings, MinecraftConfigs } from "../../../Configuration";
import { Console } from "../../../game/Console";
import { UUID } from "../../../game/UUID";

export class LoginStartPacket extends ServerboundPacket {
    /**
     * Parse requests to begin the login process
     * @param {ReadableBuffer} buf The incoming packet buffer
     * @property {string} Name The player's username
     * @async
     */
    public async Parse(buf: ReadableBuffer) {
        const username: string = buf.ReadVarChar();

        // Create an unauthenticated player object (which will remain if offline mode is enabled)
        this._Client.Player = new Player(username);

        const online: boolean = await Settings.Get(MinecraftConfigs.Online);
        if (online) {
            // Begin the encryption/authentication process
            Console.DebugPacket(this, "Beginning encryption/authentication process");
            this._Client.Queue(new EncryptionRequestPacket(this._Client));
        } else {
            Console.Warn("Online mode is off, allowing alleged player", this._Client.Player.Metadata.username.green, "to connect");

            // Prepare the player to join
            const debug: boolean = await Settings.Get(MinecraftConfigs.Debug);
            if (!debug)
                this._Client.Queue(new SetCompressionPacket(this._Client));

            // Generate a random UUID to utilize for this session
            this._Client.Player.Metadata.uuid = UUID.Generate();

            Console.DebugPacket(this, "Bypassing login due to offline mode");
            this._Client.Queue(new LoginSuccessPacket(this._Client));
        }
    }
}
