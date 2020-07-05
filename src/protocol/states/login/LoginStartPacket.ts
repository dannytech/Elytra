import * as nconf from "nconf";
import { Client } from "../../../protocol/Client";
import { IServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { SetCompressionPacket } from "./SetCompressionPacket";
import { Player } from "../../../game/Player";
import { LoginSuccessPacket } from "./LoginSuccessPacket";
import { EncryptionRequestPacket } from "./EncryptionRequestPacket";
import { UUID } from "../../../game/UUID";

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

        // Create a player object to represent the client's user account
        if (nconf.get("server:online")) {
            this._Client.Player = new Player(username);

            // Begin the encryption/authentication process
            this._Client.Queue(new EncryptionRequestPacket(this._Client));
        } else {
            this._Client.Player = new Player(username, UUID.Generate());

            console.log(`Online mode is off, allowing alleged player ${this._Client.Player.Username} to connect`);

            // Prepare the player to join
            this._Client.Queue(new SetCompressionPacket(this._Client));
            this._Client.Queue(new LoginSuccessPacket(this._Client));
        }

        return true;
    }
}
