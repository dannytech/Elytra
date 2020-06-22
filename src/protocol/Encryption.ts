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
    
    public static async Generate() : Promise<Keypair> {
        // Minecraft uses a 1024-bit RSA key by default
        const { publicKey, privateKey } = await generateKeyPairAsync("rsa", {
            modulusLength: Constants.KeyLength
        });

        return new Keypair(publicKey, privateKey);
    }

    public Decrypt(buf: Buffer) : Buffer {
        return privateDecrypt({
            key: this.PrivateKey,
            padding: crypto.constants.RSA_PKCS1_PADDING
        }, buf);
    }
}
