import { Socket } from "net";
import * as crypto from "crypto";
import { Decipher, Cipher } from "crypto";
import { EventEmitter } from "events";
import { Constants, State } from "../Configuration";
import { ClientboundPacket } from "./Packet";
import { ReadableBuffer } from "./ReadableBuffer";
import { WritableBuffer } from "./WritableBuffer";
import { Zlib } from "./Zlib";
import { Player } from "../game/Player";
import { Console } from "../game/Console";
import { PlayerInfoActions, PlayerInfoPacket } from "./states/play/PlayerInfoPacket";
import { PacketDirection } from "./PacketFactory";
import { LegacyKickPacket } from "./states/handshaking/LegacyKickPacket";
import { LegacyHandshakePacket } from "./states/handshaking/LegacyHandshakePacket";

export enum ClientState {
    Handshaking = "handshaking",
    Status = "status",
    Login = "login",
    Play = "play"
}

export enum CompressionState {
    Disabled,
    Enabling,
    Enabled
}

export type EncryptionState = {
    enabled: boolean;
    verificationToken?: Buffer;
    sharedSecret?: Buffer;
}

export class Client extends EventEmitter {
    private _Socket: Socket;
    private _ClientboundQueue: Array<ClientboundPacket>;
    private _Decipher: Decipher;
    private _Cipher: Cipher;

    public ClientId: number;
    public ProtocolVersion: number;
    public State: ClientState;
    public Compression: CompressionState;
    public Encryption: EncryptionState;
    public KeepAlive: {
        id?: bigint;
        sent?: number;
        last?: number;
    };
    public IP: string;
    public Player: Player;

    constructor(socket: Socket, id: number) {
        super();

        // Set initial values
        this._Socket = socket;
        this._ClientboundQueue = Array<ClientboundPacket>();

        this.ClientId = id;
        this.State = ClientState.Handshaking;
        this.Compression = CompressionState.Disabled;
        this.Encryption = {
            enabled: false
        };
        this.KeepAlive = {};
        this.IP = this._Socket.remoteAddress;
    }

    /**
     * Parses and processes an incoming packet(s) from the given buffer.
     * @param {ReadableBuffer} packetStream The incoming buffer of packet(s).
     * @async
     */
    public async Receive(packetStream: ReadableBuffer) {
        // Support legacy handshaking (does not require encryption, compression, etc.)
        const legacyHandshakeId = Buffer.from([0xFE, 0x01, 0xFA]);
        if (packetStream.Buffer.slice(0, 3).equals(legacyHandshakeId)) {
            const legacyHandshake: LegacyHandshakePacket = new LegacyHandshakePacket(this);

            // Consume the packet ID
            packetStream.Skip(1);

            // Generate a handshake response
            await legacyHandshake.Parse(packetStream);

            // Send the response
            return await this.Send();
        }

        // Decrypt the packet (since the cipher is never finalized, this decryption can safely process appended packets)
        if (this.Encryption.enabled) {
            if (this._Decipher == null)
                this._Decipher = crypto.createDecipheriv("aes-128-cfb8", this.Encryption.sharedSecret, this.Encryption.sharedSecret);

            // Decrypt the entire packet (no headers need to be stripped)
            const decrypted: Buffer = this._Decipher.update(packetStream.Buffer);
            packetStream = new ReadableBuffer(decrypted);
        }

        // Loop until no more packets exist
        while (packetStream.Cursor < packetStream.Buffer.length - 1) {
            const packetLength: number = packetStream.ReadVarInt();

            // A zero-length packet indicates the end of a connection (a FIN)
            if (packetLength === 0)
                return this.Disconnect();

            let packet: ReadableBuffer = new ReadableBuffer(packetStream.Read(packetLength));

            // Decompress the packet
            if (this.Compression === CompressionState.Enabled) {
                // Check that the packet met the compression threshold
                const compressedLength: number = packet.ReadVarInt();

                // If the threshold is met, then decompress the packet, otherwise assume the rest is uncompressed
                if (compressedLength > 0) {
                    const compressed: Buffer = packet.Read(compressedLength);

                    packet = await Zlib.Inflate(new ReadableBuffer(compressed));
                }
            }

            // Generate a response to the packet
            State.PacketFactory.Parse(packet, this);
        }
    }

    /**
     * Wrapper for the socket's write method.
     * @param {WritableBuffer} payload The payload to send.
     * @async
     */
    private async _Write(payload: WritableBuffer) {
        // Send the packet to the client
        await new Promise<void>((resolve, reject) => {
            this._Socket.write(payload.Buffer, (err) => {
                if (err) reject(err);

                return resolve();
            });
        });
    }

    /**
     * Dispatches queued clientbound packets to the client.
     * @async
     */
    public async Send() {
        while (this._ClientboundQueue.length > 0) {
            // Prevent writing to a closed socket in most cases
            if (!this._Socket.writable) return;

            const packet: ClientboundPacket = this._ClientboundQueue.shift();

            // Export the fields to the completed packet
            let payload: WritableBuffer = new WritableBuffer();
            await packet.Write(payload);

            if (packet instanceof LegacyKickPacket) {
                // Prevent the client from sending any more packets
                payload.Prepend().WriteByte(0xFF);

                // Send the packet
                return await this._Write(payload);
            }

            // Resolve the packet ID
            const packetId: number = State.PacketFactory.Lookup(PacketDirection.Clientbound, this, packet.constructor.name) as number;
            if (packetId == null) {
                Console.DebugPacket(packet, "Not sending due to missing packet ID");
                continue;
            }

            // Prepend the packet ID
            payload.Prepend().WriteVarInt(packetId);

            // Compress the packet
            if (this.Compression === CompressionState.Enabled) {
                let uncompressedLength: number = payload.Buffer.length;

                // Only compress over the threshold
                if (uncompressedLength > Constants.CompressionThreshold) {
                    const compressed: ReadableBuffer = await Zlib.Deflate(payload.GetReadable());
                    payload = compressed.GetWritable();
                } else uncompressedLength = 0;

                // Prepend the uncompressed length
                payload.Prepend().WriteVarInt(uncompressedLength);
            }

            // Prepend the length
            payload.Prepend().WriteVarInt(payload.Buffer.length);

            // Encrypt the packet
            if (this.Encryption.enabled) {
                if (this._Cipher == null)
                    this._Cipher = crypto.createCipheriv("aes-128-cfb8", this.Encryption.sharedSecret, this.Encryption.sharedSecret);

                // Encrypt the entire packet, including headers
                const encrypted: Buffer = this._Cipher.update(payload.Buffer);
                payload = new WritableBuffer(encrypted);
            }

            this._Write(payload);

            // Trigger after-send actions like enabling compression
            if (packet.AfterSend)
                await packet.AfterSend();
        }
    }

    /**
     * Cleans up and destroys the client connection.
     * @fires Client#disconnected
     */
    public Disconnect() {
        // Flush the clientbound queue
        this._ClientboundQueue.splice(0, this._ClientboundQueue.length);

        Console.Debug(`(${this.ClientId})`.magenta, "Disconnecting");
        this._Socket.destroy();

        // Save the player state before destroying the client
        if (this.Player) {
            State.ClientBus.Broadcast((client: Client ) => {
                // Remove the player from the list of online players
                if (client.State == ClientState.Play)
                    client.Queue(new PlayerInfoPacket(client, PlayerInfoActions.RemovePlayer, [this.Player]));
            });
            this.Player.Save();
        }

        this.emit("disconnected");
    }

    /**
     * Appends a clientbound packet to the client queue.
     * @param {ClientboundPacket} packet The packet to queue.
     * @param {boolean} [force=false] Whether to put the packet at the beginning of the queue.
     */
    public Queue(packet: ClientboundPacket, priority = false) {
        if (priority) this._ClientboundQueue.unshift(packet);
        else this._ClientboundQueue.push(packet);
    }
}