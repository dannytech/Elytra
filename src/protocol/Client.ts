import { Socket } from "net";
import * as crypto from "crypto";
import { Decipher, Cipher } from "crypto";
import { EventEmitter } from "events";

import { State } from "../State.js";
import { Player } from "../game/Player.js";
import { Logging } from "../game/Logging.js";
import { Constants } from "../Constants.js";
import { MinecraftConfigs, Settings } from "../Configuration.js";
import { ClientboundPacket } from "./Packet.js";
import { ReadableBuffer } from "./ReadableBuffer.js";
import { WritableBuffer } from "./WritableBuffer.js";
import { ProtocolStub } from "./ProtocolStub.js";
import { Zlib } from "./Zlib.js";
import { PlayerInfoActions, PlayerInfoPacket } from "./states/play/PlayerInfoPacket.js";
import { PacketDirection, PacketFactory } from "./PacketFactory.js";

enum ClientState {
    Handshaking = "handshaking",
    Status = "status",
    Login = "login",
    Play = "play"
}

enum CompressionState {
    Disabled,
    Enabling,
    Enabled
}

type EncryptionState = {
    enabled: boolean;
    verificationToken?: Buffer;
    sharedSecret?: Buffer;
};

type ProtocolState = {
    clientId: number;
    ip: string;
    port: number;
    latency: number;
    state: ClientState;
    compression: CompressionState;
    encryption: EncryptionState;
    version?: number;
};

type KeepAliveState = {
    id?: bigint;
    sent?: number;
    last?: number;
};

class Client extends EventEmitter {
    private _Socket: Socket;
    private _ClientboundQueue: ClientboundPacket[];
    private _Decipher: Decipher;
    private _Cipher: Cipher;

    public Protocol: ProtocolState;
    public KeepAlive: KeepAliveState;
    public Player: Player;
    public Locale: string;

    constructor(socket: Socket, id: number) {
        super();

        // Set initial values
        this._Socket = socket;
        this._ClientboundQueue = [];

        this.Protocol = {
            clientId: id,
            ip: socket.remoteAddress,
            port: socket.remotePort,
            latency: -1,
            state: ClientState.Handshaking,
            compression: CompressionState.Disabled,
            encryption: {
                enabled: false
            }
        };
        this.KeepAlive = {};

        Logging.Debug(`(${this.Protocol.clientId})`.magenta, "Connecting");
        Logging.Info("Connection from", `${socket.remoteAddress}:${socket.remotePort}`.green);
    }

    /**
     * Parses and processes an incoming packet(s) from the given buffer
     * @param {ProtocolStub} packetStream The incoming buffer of packet(s)
     * @async
     */
    public async Receive(packetStream: ProtocolStub) {
        while (packetStream.Stream.readable) {
            // Decrypt the packet (since the cipher is never finalized, this decryption can safely process appended packets)
            if (this.Protocol.encryption.enabled && this._Decipher == null) {
                this._Decipher = crypto.createDecipheriv("aes-128-cfb8", this.Protocol.encryption.sharedSecret, this.Protocol.encryption.sharedSecret);

                // Decrypt from the incoming stream through the decryption stream
                packetStream.Stream.pipe(this._Decipher);

                // Replace the existing stream (note that underlying stream references are preserved)
                packetStream = new ProtocolStub(this._Decipher);
            }

            // Get the length of the next packet
            const packetLength: number = await packetStream.ReadPacketLength();

            // Check packet length and reject too-large packets
            if (packetLength > Constants.MaximumPacketLength) {
                Logging.Error("Disconnecting client", `${this.Protocol.ip}:${this.Protocol.port}`.green, "for corrupted packet");
                Logging.Debug(`(${this.Protocol.clientId})`.magenta, "Client sent packet with length", packetLength.toString().blue);

                return this.Disconnect();
            }

            // A zero-length packet indicates the end of a connection (a FIN)
            // Legacy server list ping uses the packet ID 0xFE, which is not supported by Elytra
            if (packetLength == 0x00 || packetLength == 0xFE)
                return this.Disconnect();

            // Read the entire contents of the packet
            const packetBuf: Buffer = await packetStream.Read(packetLength);
            let packet: ReadableBuffer = new ReadableBuffer(packetBuf);

            // Decompress the packet
            if (this.Protocol.compression === CompressionState.Enabled) {
                // Check that the packet met the compression threshold
                const compressedLength: number = packet.ReadVarInt();

                // If the threshold is met, then decompress the packet, otherwise assume the rest is uncompressed
                if (compressedLength > 0) {
                    const compressed: Buffer = packet.Read(compressedLength);

                    // Decompress the data and create a new packet buffer
                    const decompressed: Buffer = await Zlib.Inflate(compressed);
                    packet = new ReadableBuffer(decompressed);
                } else packet = new ReadableBuffer(packet.Read()); // Discard the compressed length field
            }

            // Process the packet
            PacketFactory.Parse(packet, this);
        }
    }

    /**
     * Wrapper for the socket's write method
     * @param {WritableBuffer} payload The payload to send
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
     * Dispatches queued clientbound packets to the client
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

            // Resolve the packet ID
            const packetId: number = PacketFactory.Lookup(PacketDirection.Clientbound, this, packet.constructor.name);
            if (packetId == null) {
                Logging.DebugPacket(packet, "Not sending due to missing packet ID");
                continue;
            }

            // Prepend the packet ID
            payload.Prepend().WriteVarInt(packetId, "Packet ID");

            // If tracing is enabled, log the packet contents
            Logging.TracePacket(packet, "Packet:", ...payload.Ranges.map(range => {
                const [buffer, annotation] = range;

                return `\n\t${annotation || "Fragment"}: ${buffer.toString("hex").green}`;
            }));

            // Compress the packet
            if (this.Protocol.compression === CompressionState.Enabled) {
                let uncompressedLength: number = payload.Buffer.length;

                // Only compress over the threshold
                const compressionThreshold: number = Settings.Get(MinecraftConfigs.CompressionThreshold);
                if (uncompressedLength >= compressionThreshold) {
                    const compressed: Buffer = await Zlib.Deflate(payload.Buffer);

                    // Write the compressed data to a new buffer
                    payload = new WritableBuffer(compressed);
                } else uncompressedLength = 0;

                // Prepend the uncompressed length
                payload.Prepend().WriteVarInt(uncompressedLength);
            }

            // Prepend the length
            payload.Prepend().WriteVarInt(payload.Buffer.length);

            // Encrypt the packet
            if (this.Protocol.encryption.enabled) {
                if (this._Cipher == null)
                    this._Cipher = crypto.createCipheriv("aes-128-cfb8", this.Protocol.encryption.sharedSecret, this.Protocol.encryption.sharedSecret);

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
     * Cleans up and destroys the client connection
     * @fires Client#disconnected
     */
    public Disconnect() {
        // Flush the clientbound queue
        this._ClientboundQueue.splice(0, this._ClientboundQueue.length);

        Logging.Debug(`(${this.Protocol.clientId})`.magenta, "Disconnecting");
        this._Socket.destroy();

        // Save the player state before destroying the client
        if (this.Player) {
            State.Server.Broadcast((client: Client ) => {
                // Remove the player from the list of online players
                if (client.Protocol.state == ClientState.Play)
                    client.Queue(new PlayerInfoPacket(client, PlayerInfoActions.RemovePlayer, [this]));
            });

            // Save the player if they fully loaded
            if (this.Protocol.state === ClientState.Play)
                this.Player.Save();
        }

        this.emit("disconnected");
    }

    /**
     * Appends a clientbound packet to the client queue
     * @param {ClientboundPacket} packet The packet to queue
     * @param {boolean} [priority=false] Whether to put the packet at the beginning of the queue
     */
    public Queue(packet: ClientboundPacket, priority = false) {
        if (priority) this._ClientboundQueue.unshift(packet);
        else this._ClientboundQueue.push(packet);
    }
}

export {
    ClientState,
    CompressionState,
    EncryptionState,
    ProtocolState,
    KeepAliveState,
    Client
};
