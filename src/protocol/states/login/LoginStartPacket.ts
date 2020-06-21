import axios from "axios";
import * as nconf from "nconf";
import { v4 as uuidv4 } from "uuid";
import { Client } from "../../../Client";
import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { SetCompressionPacket } from "./SetCompressionPacket";
import { Player } from "../../../game/Player";
import { LoginSuccessPacket } from "./LoginSuccessPacket";

export class LoginStartPacket implements ServerboundPacket {
    private _Client: Client;
    
    constructor(client: Client) {
        this._Client = client;
    }
    
    public async Parse(buf: ReadableBuffer) : Promise<void> {
        const username: string = buf.ReadVarChar();
        
        // Create a player object to represent the client's user account
        if (nconf.get("online")) {
            // Resolve the player UUID
            const uuid: string = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
            this._Client.Player = new Player(username, uuid);

            // TODO Handle invalid usernames
            // TODO Begin the encryption process
        } else {
            this._Client.Player = new Player(username, uuidv4());

            // Prepare the player to join
            this._Client.Queue(new SetCompressionPacket(this._Client));
            this._Client.Queue(new LoginSuccessPacket(this._Client));
        }
    }
}