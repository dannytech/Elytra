import { ReadableBuffer } from "./ReadableBuffer.js";
import { WritableBuffer } from "./WritableBuffer.js";
import { Client } from "./Client.js";

interface IServerboundConstructor {
    new(client: Client): ServerboundPacket;
}

abstract class ServerboundPacket {
    protected _Client: Client;

    /**
     * Return the embedded client (mainly for logging purposes)
     * @returns {Client} The client
     */
    public get Client(): Client {
        return this._Client;
    }

    constructor(client: Client) {
        this._Client = client;
    }

    /**
     * Parses the packet, modifying game state and responding as needed
     * @param {ReadableBuffer} buf The packet contents to parse
     * @async
     */
    public abstract Parse(buf: ReadableBuffer): Promise<void>;

    /**
     * Post-receive hook
     * @async
     */
    public AfterReceive?(): Promise<void>;
}

abstract class ClientboundPacket {
    protected _Client: Client;

    /**
     * Return the embedded client (mainly for logging purposes)
     * @returns {Client} The client
     */
    public get Client(): Client {
        return this._Client;
    }

    constructor(client: Client) {
        this._Client = client;
    }

    /**
     * Writes the packet to a buffer
     * @param {WritableBuffer} buf The buffer to be sent to the client
     * @async
     */
    public abstract Write(buf: WritableBuffer): Promise<void>;

    /**
     * Post-send hook
     * @async
     */
    public AfterSend?(): Promise<void>;
}

export {
    IServerboundConstructor,
    ServerboundPacket,
    ClientboundPacket
};
