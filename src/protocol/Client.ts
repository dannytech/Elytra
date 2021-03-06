import { Socket } from "net";
import * as crypto from "crypto";
import { Decipher, Cipher } from "crypto";
import { EventEmitter } from "events";
import { Constants } from "../Configuration";
import { IClientboundPacket, PacketFactory } from "./Packet";
import { ReadableBuffer } from "./ReadableBuffer";
import { WritableBuffer } from "./WritableBuffer";
import { Zlib } from "./Zlib";
import { SetCompressionPacket } from "./states/login/SetCompressionPacket";
import { Player } from "../game/Player";
import { DisconnectPacket as LoginDisconnectPacket } from "./states/login/DisconnectPacket";
import { DisconnectPacket as PlayDisconnectPacket } from "./states/play/DisconnectPacket";

export enum ClientState {
    Handshaking,
    Status,
    Login,
    Play
}

export enum CompressionState {
    Disabled,
    Enabling,
    Enabled
}

export interface IEncryptionState {
    Enabled: boolean;
    VerificationToken?: Buffer;
    SharedSecret?: Buffer;
}

export class Client extends EventEmitter {
    private _Socket: Socket;
    private _ClientboundQueue: Array<IClientboundPacket>;
    private _Decipher: Decipher;
    private _Cipher: Cipher;
    
    public ClientId: number;
    public State: ClientState;
    public Compression: CompressionState;
    public Encryption: IEncryptionState;
    public Player: Player;
    public IP: string;

    constructor(socket: Socket, id: number) {
        super();

        // Set initial values
        this._Socket = socket;
        this._ClientboundQueue = Array<IClientboundPacket>();

        this.ClientId = id;
        this.State = ClientState.Handshaking;
        this.Compression = CompressionState.Disabled;
        this.Encryption = {
            Enabled: false
        };
        this.IP = this._Socket.remoteAddress;
    }

    /**
     * Parses and processes an incoming packet(s) from the given buffer.
     * @param {ReadableBuffer} packetStream The incoming buffer of packet(s).
     * @async
     */
    public async Receive(packetStream: ReadableBuffer) {
        // Decrypt the packet (since the cipher is never finalized, this decryption can safely process appended packets)
        if (this.Encryption.Enabled) {
            if (this._Decipher == null)
                this._Decipher = crypto.createDecipheriv("aes-128-cfb8", this.Encryption.SharedSecret, this.Encryption.SharedSecret);

            // Decrypt the entire packet (no headers need to be stripped)
            let decrypted: Buffer = this._Decipher.update(packetStream.Buffer);
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
            PacketFactory.Parse(packet, this);
        }
    }

    /**
     * Dispatches queued clientbound packets to the client.
     * @async
     */
    public async Send() {
        while (this._ClientboundQueue.length > 0) {
            let packet: IClientboundPacket = this._ClientboundQueue.shift();
            
            // Export the fields to the completed packet
            let payload: WritableBuffer = new WritableBuffer();
            await packet.Write(payload);

            // Prepend the packet ID
            payload.Prepend().WriteVarInt(packet.PacketID);

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
            if (this.Encryption.Enabled) {
                if (this._Cipher == null)
                    this._Cipher = crypto.createCipheriv("aes-128-cfb8", this.Encryption.SharedSecret, this.Encryption.SharedSecret);

                // Encrypt the entire packet, including headers
                let encrypted: Buffer = this._Cipher.update(payload.Buffer);
                payload = new WritableBuffer(encrypted);
            }

            // Send the packet to the client
            await new Promise((resolve, reject) => {
                this._Socket.write(payload.Buffer, (err) => {
                    if (err) reject(err);

                    return resolve();
                });
            });

            // Enable compression after telling the client it will be enabled
            if (this.Compression === CompressionState.Enabling && packet instanceof SetCompressionPacket)
                this.Compression = CompressionState.Enabled;
            
            // If the packet was a disconnection packet, stop accepting serverbound packets
            if (packet instanceof LoginDisconnectPacket || packet instanceof PlayDisconnectPacket) {
                this._ClientboundQueue.splice(0, this._ClientboundQueue.length); // Flush the clientbound queue

                this.Disconnect(); // Destroy the socket and this client
            }
        }
    }

    /**
     * Cleans up and destroys the client connection.
     * @fires Client#disconnected
     */
    public Disconnect() {
        this._Socket.destroy();

        // Save the player state before destroying the client
        if (this.Player) this.Player.Save();

        this.emit("disconnected");
    }

    /**
     * Appends a clientbound packet to the client queue.
     * @param {IClientboundPacket} packet The packet to queue.
     */
    public Queue(packet: IClientboundPacket, priority: boolean = false) {
        if (priority) this._ClientboundQueue.unshift(packet);
        else this._ClientboundQueue.push(packet);
    }
}