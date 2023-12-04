import { ServerboundPacket } from "../../Packet.js";
import { ReadableBuffer } from "../../ReadableBuffer.js";
import { ClientState } from "../../Client.js";
import { Logging } from "../../../game/Logging.js";

export class HandshakePacket extends ServerboundPacket {
    /**
     * Parse requests to switch client states
     * @param {ReadableBuffer} buf The incoming packet buffer
     * @property {number} ProtocolVersion The version of the protocol in use by the client
     * @property {string} ServerAddress The hostname the client is connecting to
     * @property {number} ServerPort - The port the client is connecting to
     * @property {number} NextState The client state to switch to
     * @async
     */
    public async Parse(buf: ReadableBuffer) {
        // First, read the protocol version
        this._Client.Protocol.version = buf.ReadVarInt("Protocol Version");
        Logging.DebugPacket(this, "Protocol version", this._Client.Protocol.version.toString().green);

        // Then, the hostname
        buf.ReadVarChar("Hostname (dummy)");

        // Then, the port
        buf.ReadUint16("Port (dummy)");

        // Switch to the requested state
        const nextState = buf.ReadVarInt("Next State");
        switch (nextState) {
            case 1:
                this._Client.Protocol.state = ClientState.Status;
                break;
            case 2:
                this._Client.Protocol.state = ClientState.Login;
                break;
        }
        Logging.DebugPacket(this, "Switching to state", this._Client.Protocol.state.green);
    }
}
