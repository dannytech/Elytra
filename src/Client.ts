import { Socket } from "net";
import { Constants } from "./Configuration";
import { ClientboundPacket, PacketFactory } from "./protocol/Packet";
import { ReadableBuffer } from "./protocol/ReadableBuffer";
import { WritableBuffer } from "./protocol/WritableBuffer";
import { Zlib } from "./protocol/Zlib";
import { SetCompressionPacket } from "./protocol/states/login/SetCompressionPacket";
import { Player } from "./game/Player";

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

export class Client {
    private _Socket: Socket;
    private _ClientboundQueue: Array<ClientboundPacket>;
    
    public ClientId: number;
    public State: ClientState;
    public Compression: CompressionState;
    public Player: Player;

    constructor(socket: Socket, id: number) {
        this._Socket = socket;
        this._ClientboundQueue = Array<ClientboundPacket>();

        this.ClientId = id;
        this.State = ClientState.Handshaking;
        this.Compression = CompressionState.Disabled;
    }

    public Queue(packet: ClientboundPacket) {
        this._ClientboundQueue.push(packet);
    }

    public async Receive(packetStream: ReadableBuffer) : Promise<void> {
        // Loop until no more packets exist
        while (packetStream.Cursor < packetStream.Buffer.length - 1) {
            const packetLength: number = packetStream.ReadVarInt();
    
            // A zero-length packet indicates the end of a connection (a FIN)
            if (packetLength === 0)
                return this.Disconnect();
            
            let packet: ReadableBuffer = new ReadableBuffer(packetStream.Read(packetLength));

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

    public async Send() : Promise<void> {
        while (this._ClientboundQueue.length > 0) {
            let packet: ClientboundPacket = this._ClientboundQueue.pop();
            
            // Export the fields to the completed packet
            let payload: WritableBuffer = new WritableBuffer();
            packet.Write(payload);

            // Prepend the packet ID
            payload.WriteVarInt(packet.PacketID, true);

            // Compress the payload
            if (this.Compression === CompressionState.Enabled) {
                let uncompressedLength: number = payload.Buffer.length;

                // Only compress over the threshold
                if (uncompressedLength > Constants.CompressionThreshold) {
                    const compressed: ReadableBuffer = await Zlib.Deflate(payload.GetReadable());
                    payload = compressed.GetWritable();
                } else {
                    uncompressedLength = 0;
                }

                // Prepend the uncompressed length
                payload.WriteVarInt(uncompressedLength, true);
            }

            // Prepend the length
            payload.WriteVarInt(payload.Buffer.length, true);

            // Send the packet to the client
            await new Promise((resolve, reject) => {
                this._Socket.write(payload.Buffer, (err) => {
                    if (err) reject(err);

                    return resolve();
                });
            });

            // Enable compression after telling the client it will be enabled
            if (this.Compression === CompressionState.Enabling && packet instanceof SetCompressionPacket)
                this.Compression = CompressionState.Enabled
        }
    }

    public Disconnect() : void {
        this._Socket.destroy();
    }
}