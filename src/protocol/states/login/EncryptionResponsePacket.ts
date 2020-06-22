import { State } from "../../../Configuration";
import { Client } from "../../../Client";
import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { SetCompressionPacket } from "./SetCompressionPacket";
import { LoginSuccessPacket } from "./LoginSuccessPacket";
import { DisconnectPacket } from "./DisconnectPacket";

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
        
        // Finish the handshake and proceed to the play state
        this._Client.Queue(new SetCompressionPacket(this._Client));
        this._Client.Queue(new LoginSuccessPacket(this._Client));
    }
}