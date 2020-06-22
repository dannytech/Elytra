import { promisify } from "util";
import { generateKeyPair, KeyObject } from "crypto";
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
}