import { IServerboundPacket } from "../../Packet";
import { ReadableBuffer } from "../../ReadableBuffer";
import { Client, ClientState } from "../../Client";
import { Console } from "../../../game/Console";

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
    public async Parse(buf: ReadableBuffer) {
        // First, read the protocol version
        this._Client.ProtocolVersion = buf.ReadVarInt();
        Console.Debug(`(${this._Client.ClientId})`.magenta, "[C → S]".blue, "[HandshakePacket]".green,
            `Protocol version: ${this._Client.ProtocolVersion.toString().green}`);

        // Then, the hostname
        buf.ReadVarChar();

        // Then, the port
        buf.ReadUint16();

        // Switch to the requested state
        const nextState = buf.ReadVarInt();
        switch (nextState) {
            case 1:
                this._Client.State = ClientState.Status;
                break;
            case 2:
                this._Client.State = ClientState.Login;
                break;
        }
        Console.Debug(`(${this._Client.ClientId})`.magenta, "[C → S]".blue, "[HandshakePacket]".green,
            `Switching to state ${this._Client.State.green}`);
    }
}
