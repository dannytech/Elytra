import { Client } from "../../../protocol/Client";
import { IServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { SetCompressionPacket } from "./SetCompressionPacket";
import { Player } from "../../../game/Player";
import { LoginSuccessPacket } from "./LoginSuccessPacket";
import { EncryptionRequestPacket } from "./EncryptionRequestPacket";
import { JoinGamePacket } from "../play/JoinGamePacket";
import { Settings, MinecraftConfigs } from "../../../Configuration";
import { Console } from "../../../game/Console";

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
        const debug: boolean = await Settings.Get(MinecraftConfigs.Debug);
        if (online && !debug) {
            // Begin the encryption/authentication process
            Console.Debug(`(${this._Client.ClientId})`, "[C → S]", "[LoginStartPacket]", "Beginning encryption/authentication process");
            this._Client.Queue(new EncryptionRequestPacket(this._Client));
        } else {
            Console.Warn(`Online mode is off, allowing alleged player ${this._Client.Player.Username} to connect`);

            // Prepare the player to join
            if (!debug)
                this._Client.Queue(new SetCompressionPacket(this._Client));

            Console.Debug(`(${this._Client.ClientId})`, "[C → S]", "[LoginStartPacket]", "Bypassing login due to online mode being off");
            this._Client.Queue(new LoginSuccessPacket(this._Client));
            this._Client.Queue(new JoinGamePacket(this._Client));
        }

        return true;
    }
}
