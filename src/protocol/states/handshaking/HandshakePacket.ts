import { IServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { Client, ClientState } from "../../Client";

export class HandshakePacket implements IServerboundPacket {
    private _Client: Client;
    
    constructor(client: Client) {
        this._Client = client;
    }
    
    /**
     * Parse requests to switch client states.
     * @param {ReadableBuffer} buf The incoming packet buffer.
     * @property {number} ProtocolVersion The version of the protocol in use by the client.
     * @property {string} ServerAddress The hostname the client is connecting to.
     * @property {number} ServerPort - The port the client is connecting to.
     * @property {number} NextState The client state to switch to.
     * @async
     */
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
