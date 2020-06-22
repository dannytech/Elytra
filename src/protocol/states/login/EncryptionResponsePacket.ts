import * as nconf from "nconf";
import axios, { AxiosResponse } from "axios";
import { State } from "../../../Configuration";
import { Client } from "../../../Client";
import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { SetCompressionPacket } from "./SetCompressionPacket";
import { LoginSuccessPacket } from "./LoginSuccessPacket";
import { DisconnectPacket } from "./DisconnectPacket";
import { digest } from "../../Encryption";

interface AuthenticationRequestParams {
    username: string,
    serverId: string,
    ip?: string
}

export class EncryptionResponsePacket implements ServerboundPacket {
    private _Client: Client;
    
    constructor(client: Client) {
        this._Client = client;
    }
    
    public async Parse(buf: ReadableBuffer) {
        // Read the client-generate shared secret
        const sharedSecretLength: number = buf.ReadVarInt();
        const sharedSecret: Buffer = buf.Read(sharedSecretLength);

        // Decrypt the shared secret using the server's private key
        const decryptedSecret: Buffer = State.Keypair.Decrypt(sharedSecret);
        
        // Read the encrypted verification token
        const verifyTokenLength: number = buf.ReadVarInt();
        const verifyToken: Buffer = buf.Read(verifyTokenLength);

        // Verify the token can be decrypted successfully
        const decryptedToken: Buffer = State.Keypair.Decrypt(verifyToken);
        if (!decryptedToken.equals(this._Client.Encryption.VerificationToken))
            return this._Client.Queue(new DisconnectPacket("Failed to negotiate encrypted channel"));

        // Tell the socket to use encryption
        this._Client.Encryption.SharedSecret = decryptedSecret;
        this._Client.Encryption.Enabled = true;
        delete this._Client.Encryption.VerificationToken;

        // Generate the server hash for authentication
        const serverHash: string = digest([
            Buffer.alloc(0),
            decryptedSecret,
            State.Keypair.PublicKey.export({ format: "der", type: "spki" })
        ]);

        // Prepare to authenticate the client
        let params: AuthenticationRequestParams = {
            username: this._Client.Player.Username,
            serverId: serverHash
        };
        
        // Ensures the client authentication and joining client originate from the same source
        if (nconf.get("server:preventProxy")) params["ip"] = this._Client.IP;

        // Authenticate the client
        let res: AxiosResponse = await axios.get("https://sessionserver.mojang.com/session/minecraft/hasJoined", {
            params
        });

        // Authenticate the joining client
        if (res.status == 200)
            this._Client.Player.UUID = res.data["id"];
        else return this._Client.Queue(new DisconnectPacket("Invalid session"));

        // Finish the handshake and proceed to the play state
        this._Client.Queue(new SetCompressionPacket(this._Client));
        this._Client.Queue(new LoginSuccessPacket(this._Client));
    }
}