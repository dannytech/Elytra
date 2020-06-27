import { promisify } from "util";
import * as crypto from "crypto";
import { IClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { Client } from "../../Client";
import { State, Constants } from "../../../Configuration";

const randomBytesAsync = promisify(crypto.randomBytes);

export class EncryptionRequestPacket implements IClientboundPacket {
    private _Client: Client;

    public PacketID: number = 0x01;

    constructor(client: Client) {
        this._Client = client;
    }

    public async Write(buf: WritableBuffer) {
        // Writes an empty server ID (post-1.7, no server ID is needed)
        buf.WriteVarChar("");

        // Export the public key
        const publicKey: Buffer = State.Keypair.PublicKey.export({ format: "der", type: "spki" });

        // Write the public key
        buf.WriteVarInt(publicKey.length);
        buf.Write(publicKey);

        // Generate a verification token
        const verificationToken: Buffer = await randomBytesAsync(Constants.VerificationTokenLength);

        // Write the verification token
        buf.WriteVarInt(verificationToken.length);
        buf.Write(verificationToken);

        // Store the token in the client state
        this._Client.Encryption.VerificationToken = verificationToken;
    }
}
