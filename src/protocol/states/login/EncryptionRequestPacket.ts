import { promisify } from "util";
import * as crypto from "crypto";
import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";
import { State } from "../../../Configuration";
import { Logging } from "../../../game/Logging";
import { Constants } from "../../../Constants";

const randomBytesAsync = promisify(crypto.randomBytes);

export class EncryptionRequestPacket extends ClientboundPacket {
    /**
     * Tell the client to authenticate and negotiate encryption
     * @param {WritableBuffer} buf The outgoing packet buffer
     * @property {string} ServerID The server ID, not included in this protocol version
     * @property {number} PublicKeyLength The length of the public key, in bytes
     * @property {Buffer} PublicKey A byte array of the specified length, containing the server's public key
     * @property {number} VerifyTokenLength The length of the verification token, in bytes
     * @property {Buffer} VerifyToken A byte array of the specified length, to verify shared secret integrity
     * @async
     */
    public async Write(buf: WritableBuffer) {
        // Writes an empty server ID (post-1.7, no server ID is needed)
        buf.WriteVarChar("", "Server ID");

        // Export the public key
        const publicKey: Buffer = State.Keypair.PublicKey.export({ format: "der", type: "spki" });

        // Write the public key
        Logging.DebugPacket(this, "Requesting to enable encryption");
        buf.WriteBuffer(publicKey, "Public Key");

        // Generate a verification token
        const verificationToken: Buffer = await randomBytesAsync(Constants.VerificationTokenLength);

        // Write the verification token
        buf.WriteBuffer(verificationToken, "Verification Token");

        // Store the token in the client state
        this._Client.Protocol.encryption.verificationToken = verificationToken;
    }
}
