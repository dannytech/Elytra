import { Client } from "../../../protocol/Client";
import { IServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { SetCompressionPacket } from "./SetCompressionPacket";
import { Player } from "../../../game/Player";
import { LoginSuccessPacket } from "./LoginSuccessPacket";
import { EncryptionRequestPacket } from "./EncryptionRequestPacket";
import { JoinGamePacket } from "../play/JoinGamePacket";
import { Settings, MinecraftConfigs } from "../../../Configuration";

interface ProfileResponse {
    name: string,
    id: string
}

export class LoginStartPacket implements IServerboundPacket {
    private _Client: Client;
    
    constructor(client: Client) {
        this._Client = client;
    }
    
    /**
     * Parse requests to begin the login process.
     * @param {ReadableBuffer} buf The incoming packet buffer.
     * @property {string} Name The player's username.
     * @async
     */
    public async Parse(buf: ReadableBuffer) : Promise<boolean> {
        const username: string = buf.ReadVarChar();

        // Create an unauthenticated player object (which will remain if offline mode is enabled)
        this._Client.Player = new Player(username);

        const online: boolean = await Settings.Get(MinecraftConfigs.Online);
        if (online) {

            // Begin the encryption/authentication process
            this._Client.Queue(new EncryptionRequestPacket(this._Client));
        } else {
            console.log(`Online mode is off, allowing alleged player ${this._Client.Player.Username} to connect`);

            // Prepare the player to join
            this._Client.Queue(new SetCompressionPacket(this._Client));
            this._Client.Queue(new LoginSuccessPacket(this._Client));
            this._Client.Queue(new JoinGamePacket(this._Client));
        }

        return true;
    }
}
