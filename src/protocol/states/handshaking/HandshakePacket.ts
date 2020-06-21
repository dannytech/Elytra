import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { Client, ClientState } from "../../../Client";

export class HandshakePacket implements ServerboundPacket {
    private _Buffer: ReadableBuffer;
    private _Client: Client;

    public PacketID: number;
    
    constructor(buf: ReadableBuffer, client: Client) {
        this._Buffer = buf;
        this._Client = client;
    }
    
    public async Parse() : Promise<void> {
        // First, read the protocol version
        this._Buffer.ReadVarInt();

        // Then, the hostname
        this._Buffer.ReadVarChar();
        
        // Then, the port
        this._Buffer.ReadUint16();

        // Switch to the requested state
        switch (this._Buffer.ReadVarInt()) {
            case 1:
                this._Client.State = ClientState.Status;
                break;
            case 2:
                this._Client.State = ClientState.Login;
                break;
        }
    }
}