import axios, { AxiosResponse } from "axios";
import { State, Settings, MinecraftConfigs } from "../../../Configuration";
import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { SetCompressionPacket } from "./SetCompressionPacket";
import { LoginSuccessPacket } from "./LoginSuccessPacket";
import { DisconnectPacket as LoginDisconnectPacket } from "./DisconnectPacket";
import { DisconnectPacket as PlayDisconnectPacket } from "../play/DisconnectPacket";
import { digest } from "../../Encryption";
import { Player } from "../../../game/Player";
import { UUID } from "../../../game/UUID";
import { ChatTextComponentFactory } from "../../../game/chat/ChatTextComponentFactory";
import { Console } from "../../../game/Console";
import { PlayerModel } from "../../../database/models/PlayerModel";
import { r } from "rethinkdb-ts";

type AuthenticationRequestParams = {
    username: string,
    serverId: string,
    ip?: string
};

type SessionResponse = {
    id: string,
    name: string,
    properties: [
        {
            name: string,
            value: string,
            signature: string
        }
    ]
};

type FilterList = {
    mode: string,
    players: string[]
};

export class EncryptionResponsePacket extends ServerboundPacket {
    /**
     * Parse a response to the server's encryption request
     * @param {ReadableBuffer} buf The incoming packet buffer
     * @property {number} SharedSecretLength The length of the shared secret, in bytes
     * @property {Buffer} SharedSecret A byte array of the specified length, containing the shared secret
     * @property {number} VerifyTokenLength The length of the encrypted verification token, in bytes
     * @property {Buffer} VerifyToken A byte array of the specified length, containing the encrypted verification token
     * @async
     */
    public async Parse(buf: ReadableBuffer) {
        // Read the client-generated shared secret
        const sharedSecretLength: number = buf.ReadVarInt();
        const sharedSecret: Buffer = buf.Read(sharedSecretLength);

        // Decrypt the shared secret using the server's private key
        const decryptedSecret: Buffer = State.Keypair.Decrypt(sharedSecret);

        // Read the encrypted verification token
        const verifyTokenLength: number = buf.ReadVarInt();
        const verifyToken: Buffer = buf.Read(verifyTokenLength);

        // Verify the token can be decrypted successfully
        Console.DebugPacket(this, "Verifying nonce");
        const decryptedToken: Buffer = State.Keypair.Decrypt(verifyToken);
        if (decryptedToken.equals(this._Client.Protocol.encryption.verificationToken)) {
            // Tell the socket to use encryption
            this._Client.Protocol.encryption.sharedSecret = decryptedSecret;
            this._Client.Protocol.encryption.enabled = true;
            delete this._Client.Protocol.encryption.verificationToken;

            // Log the session key at trace level
            Console.Trace(`(${this._Client.Protocol.clientId})`.magenta, "Encrypting packets with key", this._Client.Protocol.encryption.sharedSecret.toString("hex").green);

            // Generate the server hash for authentication
            const serverHash: string = digest(Buffer.concat([
                decryptedSecret,
                State.Keypair.PublicKey.export({ format: "der", type: "spki" })
            ]));

            // Prepare to authenticate the client
            const params: AuthenticationRequestParams = {
                username: this._Client.Player.Metadata.username,
                serverId: serverHash
            };

            // Ensures the client authentication and joining client originate from the same source
            const preventProxy: boolean = Settings.Get(MinecraftConfigs.PreventProxy);
            const debug: boolean = Settings.Get(MinecraftConfigs.Debug);
            if (preventProxy && !debug) params["ip"] = this._Client.Protocol.ip;

            // Authenticate the client
            Console.DebugPacket(this, "Authenticating client against Mojang servers");
            const res: AxiosResponse<SessionResponse> = await axios.get("https://sessionserver.mojang.com/session/minecraft/hasJoined", {
                params
            });

            // Confirm client authentication succeeded
            if (res.status == 200) {
                // Attempt to load the player from the database
                const player = await r.table<PlayerModel>("player")
                    .get(res.data.id)
                    .run();

                // Deserialize or create the player object
                if (player)
                    this._Client.Player = Player.Mapper.load(player);
                else this._Client.Player = new Player(this._Client.Player.Metadata.username, new UUID(res.data.id));

                // Configure metadata received from Mojang servers
                this._Client.Player.Metadata.properties = res.data.properties;

                Console.Info(this._Client.Player.Metadata.username.green, "authenticated successfully with UUID", this._Client.Player.Metadata.uuid.Format(true).blue);

                // Finish the handshake and proceed to the play state
                const allowCompression: boolean = Settings.Get(MinecraftConfigs.AllowCompression);
                if (allowCompression)
                    this._Client.Queue(new SetCompressionPacket(this._Client));

                Console.DebugPacket(this, "Switching to encrypted channel");
                this._Client.Queue(new LoginSuccessPacket(this._Client));
            } else {
                this._Client.Queue(new LoginDisconnectPacket(this._Client, ChatTextComponentFactory.FromString("Invalid session")), true);

                Console.Error("Player", this._Client.Player.Metadata.username.green, "has invalid session (might be using a proxy)");
            }
        } else {
            this._Client.Queue(new LoginDisconnectPacket(this._Client, ChatTextComponentFactory.FromString("Failed to negotiate encrypted channel")), true);

            Console.Error("Player", this._Client.Player.Metadata.username.green, "failed to negotiate encrypted channel");
        }

        // Load the player filter
        const filter: FilterList = Settings.Get(MinecraftConfigs.Filter);
        const inFilter: boolean = filter?.players?.some(uuid => uuid == this._Client.Player.Metadata.uuid.Format());

        // Determine whether the player is allowed to join
        Console.DebugPacket(this, "Checking player against filter");
        if (filter?.mode == "deny" && inFilter) {
            this._Client.Queue(new PlayDisconnectPacket(this._Client, ChatTextComponentFactory.FromString("You have been disallowed from this server")));

            Console.Error("Player", this._Client.Player.Metadata.username.green, "is disallowed by filter");
        } else if (filter?.mode == "allow" && !inFilter) {
            this._Client.Queue(new PlayDisconnectPacket(this._Client, ChatTextComponentFactory.FromString("You have not been allowed on this server")));

            Console.Warn("Player", this._Client.Player.Metadata.username.green, "is not allowed by filter");
        }
    }
}
