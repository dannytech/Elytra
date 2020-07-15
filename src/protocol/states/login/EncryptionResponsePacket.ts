import axios, { AxiosResponse } from "axios";
import { State, Settings, MinecraftConfigs } from "../../../Configuration";
import { Client } from "../../Client";
import { IServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { SetCompressionPacket } from "./SetCompressionPacket";
import { LoginSuccessPacket } from "./LoginSuccessPacket";
import { DisconnectPacket } from "./DisconnectPacket";
import { digest } from "../../Encryption";
import { Player } from "../../../game/Player";
import { UUID } from "../../../game/UUID";

interface AuthenticationRequestParams {
    username: string,
    serverId: string,
    ip?: string
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
            let res: AxiosResponse = await axios.get("https://sessionserver.mojang.com/session/minecraft/hasJoined", {
                params
            });

            // Confirm client authentication succeeded
            if (res.status == 200) {
                this._Client.Player = await Player.Load(this._Client.Player.Username, new UUID(res.data["id"]));

                console.log(`Player ${this._Client.Player.Username} with UUID ${this._Client.Player.UUID.Format(true)} authenticated successfully`);

                // Finish the handshake and proceed to the play state
                this._Client.Queue(new SetCompressionPacket(this._Client));
                this._Client.Queue(new LoginSuccessPacket(this._Client));
                this._Client.Queue(new JoinGamePacket(this._Client));
            } else {
                this._Client.Queue(new DisconnectPacket("Invalid session"));
                console.log(`Player ${this._Client.Player.Username} has invalid session`);
            }
        } else {
            this._Client.Queue(new DisconnectPacket("Failed to negotiate encrypted channel"));
            console.log(`Player ${this._Client.Player.Username} failed to negotiate encrypted channel`);
        }

        return true;
    }
}
