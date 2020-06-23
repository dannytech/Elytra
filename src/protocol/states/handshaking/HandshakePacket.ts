import { ServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { Client, ClientState } from "../../../Client";

export class HandshakePacket implements ServerboundPacket {
    private _Client: Client;
    
    constructor(client: Client) {
        this._Client = client;
    }
    
    public async Parse(buf: ReadableBuffer) : Promise<boolean> {
        // First, read the protocol version
        buf.ReadVarInt();

        // Then, the hostname
        buf.ReadVarChar();
        
        // Then, the port
        buf.ReadUint16();

        // Switch to the requested state
        switch (buf.ReadVarInt()) {
            case 1:
                this._Client.State = ClientState.Status;
                break;
            case 2:
                this._Client.State = ClientState.Login;
                break;
        }

        return false;
    }
}
