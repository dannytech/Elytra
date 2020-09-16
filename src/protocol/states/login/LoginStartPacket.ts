import axios from "axios";
import { AxiosResponse } from "axios";
import { Client } from "../../../protocol/Client";
import { IServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { SetCompressionPacket } from "./SetCompressionPacket";
import { Player } from "../../../game/Player";
import { LoginSuccessPacket } from "./LoginSuccessPacket";
import { EncryptionRequestPacket } from "./EncryptionRequestPacket";
import { JoinGamePacket } from "../play/JoinGamePacket";
import { DisconnectPacket } from "./DisconnectPacket";
import { UUID } from "../../../game/UUID";
import { Settings, MinecraftConfigs } from "../../../Configuration";
import { ChatComponentFactory } from "../../../game/chat/ChatComponentFactory";

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

        // Create a player object to represent the client's user account
        const online: boolean = await Settings.Get(MinecraftConfigs.Online);
        if (online) {
            this._Client.Player = new Player(username);

            // Begin the encryption/authentication process
            this._Client.Queue(new EncryptionRequestPacket(this._Client));
        } else {
            // Authenticate the client
            let res: AxiosResponse<ProfileResponse> = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);

            // Confirm client authentication succeeded
            if (res.status == 200) {
                // Create an unauthenticated player object
                this._Client.Player = await Player.Load(username, new UUID(res.data.id));

                console.log(`Online mode is off, allowing alleged player ${this._Client.Player.Username} to connect`);

                // Prepare the player to join
                this._Client.Queue(new SetCompressionPacket(this._Client));
                this._Client.Queue(new LoginSuccessPacket(this._Client));
                this._Client.Queue(new JoinGamePacket(this._Client));
            } else {
                this._Client.Queue(new DisconnectPacket(ChatComponentFactory.FromFormattedString("Invalid user")), true);

                console.log(`Player ${this._Client.Player.Username} is an invalid offline-mode user`);
            }
        }

        return true;
    }
}
