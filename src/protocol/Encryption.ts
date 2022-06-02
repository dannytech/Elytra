import { promisify } from "util";
import * as crypto from "crypto";
import { generateKeyPair, privateDecrypt, KeyObject } from "crypto";
import { Constants } from "../Configuration";

const generateKeyPairAsync = promisify(generateKeyPair);

export class Keypair {
    public PublicKey: KeyObject;
    public PrivateKey: KeyObject;

    constructor(publicKey: KeyObject, privateKey: KeyObject) {
        this.PublicKey = publicKey;
        this.PrivateKey = privateKey;
    }

    /**
     * Decrypt the given buffer using the keypair's private key.
     * @param {Buffer} buf The buffer to decrypt.
     */
    public Decrypt(buf: Buffer) : Buffer {
        return privateDecrypt({
            key: this.PrivateKey,
            padding: crypto.constants.RSA_PKCS1_PADDING
        }, buf);
    }

    /**
     * Generate a new RSA keypair.
     * @returns {Keypair} The newly-generated keypair.
     * @static
     * @async
     */
    public static async Generate() : Promise<Keypair> {
        // Minecraft uses a 1024-bit RSA key by default
        const { publicKey, privateKey } = await generateKeyPairAsync("rsa", {
            modulusLength: Constants.KeyLength
        });

        return new Keypair(publicKey, privateKey);
    }
}

/**
 * Generates a Minecraft-style hex digest of the given buffer.
 * @param {Buffer} buf The buffer to hash.
 */
export function digest(buf: Buffer) : string {
    // Generate a standard SHA-1 hash
    let digest: Buffer = crypto.createHash("sha1")
        .update(buf)
        .digest();

    // Check if the MSB is 1 (which is interpreted as a signed integer with a negative value)
    const isNegative: boolean = digest.readInt8() < 0;

    // If the digest is negative, flip all the bits
    if (isNegative) {
        const inverted: Buffer = Buffer.alloc(digest.length);

        // Loop through the bits backwards
        let carry: number = 0;
        for (let i: number = digest.length - 1; i >= 0; i--) {
            let flipped: number = digest.readUInt8(i) ^ 0b11111111; // Flip all the bits

            // If this is the first byte we're processing, add 1 (this will propagate throughout the rest of the calculations)
            if (i === digest.length - 1) flipped++;

            // Handle the addition of a 1 due to two's complement
            flipped += carry;
            carry = Math.max(0, flipped - 0b11111111);
            flipped = Math.min(0b11111111, flipped);

            inverted.writeUInt8(flipped, i);
        }

        digest = inverted;
    }

    // Export the hash
    const hexDigest: string = digest.toString("hex").replace(/^0+/, "");

    return isNegative ? `-${hexDigest}` : hexDigest;
}
