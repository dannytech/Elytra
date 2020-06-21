import { Socket } from "net";
import { ClientboundPacket, PacketFactory } from "./protocol/Packet";
import { ReadableBuffer } from "./protocol/ReadableBuffer";
import { WritableBuffer } from "./protocol/WritableBuffer";
import { Zlib } from "./protocol/Zlib";

export enum ClientState {
    Handshaking,
    Status,
    Login,
    Play
}

export enum CompressionState {
    Enabled,
    Enabling,
    Disabled
}

export class Client {
    private _Socket: Socket;
    private _ClientboundQueue: Array<ClientboundPacket>;
    
    public ClientId: number;
    public State: ClientState;
    public Compression: CompressionState;

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
            let payload: WritableBuffer = packet.Write();

            // Prepend the packet ID
            payload.WriteVarInt(packet.PacketID, true);

            // Compress the payload
            if (this.Compression === CompressionState.Enabled) {
                let uncompressedLength: number = payload.Buffer.length;

                // Only compress over the threshold
                if (uncompressedLength > 64) {
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
            this._Socket.write(payload.Buffer);
        }
    }

    public Disconnect() : void {
        this._Socket.destroy();
    }
}