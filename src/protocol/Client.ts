import { Socket } from "net";
import * as crypto from "crypto";
import { Decipher, Cipher } from "crypto";
import { EventEmitter } from "events";
import { Constants } from "../Configuration";
import { ClientboundPacket, PacketFactory } from "./Packet";
import { ReadableBuffer } from "./ReadableBuffer";
import { WritableBuffer } from "./WritableBuffer";
import { Zlib } from "./Zlib";
import { SetCompressionPacket } from "./states/login/SetCompressionPacket";
import { Player } from "../game/Player";

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

export interface EncryptionState {
    Enabled: boolean;
    VerificationToken?: Buffer;
    SharedSecret?: Buffer;
}

export class Client extends EventEmitter {
    private _Socket: Socket;
    private _ClientboundQueue: Array<ClientboundPacket>;
    private _Decipher: Decipher;
    private _Cipher: Cipher;
    
    public ClientId: number;
    public State: ClientState;
    public Compression: CompressionState;
    public Encryption: EncryptionState;
    public Player: Player;
    public IP: string;

    constructor(socket: Socket, id: number) {
        super();

        // Set initial values
        this._Socket = socket;
        this._ClientboundQueue = Array<ClientboundPacket>();

        this.ClientId = id;
        this.State = ClientState.Handshaking;
        this.Compression = CompressionState.Disabled;
        this.Encryption = {
            Enabled: false
        };
        this.IP = this._Socket.remoteAddress
    }

    public async Receive(packetStream: ReadableBuffer) {
        // Loop until no more packets exist
        while (packetStream.Cursor < packetStream.Buffer.length - 1) {
            const packetLength: number = packetStream.ReadVarInt();
    
            // A zero-length packet indicates the end of a connection (a FIN)
            if (packetLength === 0)
                return this.Disconnect();

            let packet: ReadableBuffer = new ReadableBuffer(packetStream.Read(packetLength));

            // Decrypt the packet
            if (this.Encryption.Enabled) {
                if (this._Decipher == null)
                    this._Decipher = crypto.createDecipheriv("aes-128-cfb8", this.Encryption.SharedSecret, this.Encryption.SharedSecret);

                // Decrypt the entire packet (no headers need to be stripped)
                let decrypted: Buffer = this._Decipher.update(packet.Buffer);
                packet = new ReadableBuffer(decrypted);
            }

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

    public async Send() {
        while (this._ClientboundQueue.length > 0) {
            let packet: ClientboundPacket = this._ClientboundQueue.shift();
            
            // Export the fields to the completed packet
            let payload: WritableBuffer = new WritableBuffer();
            await packet.Write(payload);

            // Prepend the packet ID
            payload.WriteVarInt(packet.PacketID, true);

            // Compress the packet
            if (this.Compression === CompressionState.Enabled) {
                let uncompressedLength: number = payload.Buffer.length;

                // Only compress over the threshold
                if (uncompressedLength > Constants.CompressionThreshold) {
                    const compressed: ReadableBuffer = await Zlib.Deflate(payload.GetReadable());
                    payload = compressed.GetWritable();
                } else uncompressedLength = 0;

                // Prepend the uncompressed length
                payload.WriteVarInt(uncompressedLength, true);
            }

            // Prepend the length
            payload.WriteVarInt(payload.Buffer.length, true);

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
        }
    }

    public Disconnect() {
        this._Socket.destroy();

        this.emit("disconnected");
    }

    public Queue(packet: ClientboundPacket) {
        this._ClientboundQueue.push(packet);
    }
}