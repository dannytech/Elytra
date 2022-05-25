import axios, { AxiosResponse } from "axios";
import { State, Settings, MinecraftConfigs } from "../../../Configuration";
import { Client } from "../../Client";
import { IServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { SetCompressionPacket } from "./SetCompressionPacket";
import { LoginSuccessPacket } from "./LoginSuccessPacket";
import { DisconnectPacket as LoginDisconnectPacket } from "./DisconnectPacket";
import { DisconnectPacket as PlayDisconnectPacket } from "../play/DisconnectPacket";
import { digest } from "../../Encryption";
import { JoinGamePacket } from "../play/JoinGamePacket";
import { Player } from "../../../game/Player";
import { UUID } from "../../../game/UUID";
import { ChatComponentFactory } from "../../../game/chat/ChatComponentFactory";

interface AuthenticationRequestParams {
    username: string,
    serverId: string,
    ip?: string
}

interface SessionResponse {
    id: string,
    name: string,
    properties: [
        {
            name: string,
            value: string,
            signature: string
        }
    ]
}

interface FilterList {
    mode: string,
    players: [
        {
            username?: string,
            uuid: string
        }
    ]
}

export class EncryptionResponsePacket implements IServerboundPacket {
    private _Client: Client;
    
    constructor(client: Client) {
        this._Client = client;
    }
    
    /**
     * Parse a response to the server's encryption request.
     * @param {ReadableBuffer} buf The incoming packet buffer.
     * @property {number} SharedSecretLength The length of the shared secret, in bytes.
     * @property {Buffer} SharedSecret A byte array of the specified length, containing the shared secret.
     * @property {number} VerifyTokenLength The length of the encrypted verification token, in bytes.
     * @property {Buffer} VerifyToken A byte array of the specified length, containing the encrypted verification token.
     * @async
     */
    public async Parse(buf: ReadableBuffer) : Promise<boolean> {
        // Read the client-generated shared secret
        const sharedSecretLength: number = buf.ReadVarInt();
        const sharedSecret: Buffer = buf.Read(sharedSecretLength);

        // Decrypt the shared secret using the server's private key
        const decryptedSecret: Buffer = State.Keypair.Decrypt(sharedSecret);
        
        // Read the encrypted verification token
        const verifyTokenLength: number = buf.ReadVarInt();
        const verifyToken: Buffer = buf.Read(verifyTokenLength);

        // Verify the token can be decrypted successfully
        const decryptedToken: Buffer = State.Keypair.Decrypt(verifyToken);
        if (decryptedToken.equals(this._Client.Encryption.VerificationToken)) {
            // Tell the socket to use encryption
            this._Client.Encryption.SharedSecret = decryptedSecret;
            this._Client.Encryption.Enabled = true;
            delete this._Client.Encryption.VerificationToken;

            // Generate the server hash for authentication
            const serverHash: string = digest(Buffer.concat([
                decryptedSecret,
                State.Keypair.PublicKey.export({ format: "der", type: "spki" })
            ]));

            // Prepare to authenticate the client
            let params: AuthenticationRequestParams = {
                username: this._Client.Player.Username,
                serverId: serverHash
            };

            // Ensures the client authentication and joining client originate from the same source
            const preventProxy: boolean = await Settings.Get(MinecraftConfigs.PreventProxy);
            if (preventProxy) params["ip"] = this._Client.IP;

            // Authenticate the client
            let res: AxiosResponse<SessionResponse> = await axios.get("https://sessionserver.mojang.com/session/minecraft/hasJoined", {
                params
            });

            // Confirm client authentication succeeded
            if (res.status == 200) {
                this._Client.Player = new Player(this._Client.Player.Username, new UUID(res.data.id));
                await this._Client.Player.Load();

                console.log(`${this._Client.Player.Username} authenticated successfully with UUID ${this._Client.Player.UUID.Format(true)}`);

                // Finish the handshake and proceed to the play state
                this._Client.Queue(new SetCompressionPacket(this._Client));
                this._Client.Queue(new LoginSuccessPacket(this._Client));
                this._Client.Queue(new JoinGamePacket(this._Client));
            } else {
                this._Client.Queue(new LoginDisconnectPacket(ChatComponentFactory.FromFormattedString("Invalid session")), true);

                console.log(`Player ${this._Client.Player.Username} has invalid session`);
            }
        } else {
            this._Client.Queue(new LoginDisconnectPacket(ChatComponentFactory.FromFormattedString("Failed to negotiate encrypted channel")), true);

            console.log(`Player ${this._Client.Player.Username} failed to negotiate encrypted channel`);
        }

        // Load the player filter
        const filter: FilterList = await Settings.Get(MinecraftConfigs.Filter);
        const inFilter: boolean = filter?.players?.some(player => player.uuid == this._Client.Player.UUID.Format());
        
        // Determine whether the player is allowed to join
        if (filter?.mode == "deny" && inFilter) {
            this._Client.Queue(new PlayDisconnectPacket(ChatComponentFactory.FromFormattedString("You have been disallowed from this server")));
            
            console.log(`Player ${this._Client.Player.Username} is disallowed by filter, disconnecting`);
        } else if (filter?.mode == "allow" && !inFilter) {
            this._Client.Queue(new PlayDisconnectPacket(ChatComponentFactory.FromFormattedString("You have not been allowed on this server")));
        
            console.log(`Player ${this._Client.Player.Username} is not allowed by filter, disconnecting`);
        }

        return true;
    }
}
