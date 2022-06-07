import { ReadableBuffer } from "./ReadableBuffer";
import { WritableBuffer } from "./WritableBuffer";
import { Client } from "./Client";

export interface IServerboundConstructor {
    new(client: Client): ServerboundPacket;
}

export abstract class ServerboundPacket {
    protected _Client: Client;

    constructor(client: Client) {
        this._Client = client;
    }

    /**
     * Parses the packet, modifying game state and responding as needed.
     * @param {ReadableBuffer} buf The packet contents to parse.
     * @async
     */
    public abstract Parse(buf: ReadableBuffer) : Promise<void>;

    /**
     * Return the embedded client (mainly for logging purposes).
     * @returns {Client} The client.
     */
    public GetClient() : Client {
        return this._Client;
    }

    /**
     * Post-receive hook.
     * @async
     */
    public AfterReceive?(): Promise<void>;
}

export abstract class ClientboundPacket {
    protected _Client: Client;

    constructor(client: Client) {
        this._Client = client;
    }

    /**
     * Writes the packet to a buffer.
     * @param {WritableBuffer} buf The buffer to be sent to the client.
     * @async
     */
    public abstract Write(buf: WritableBuffer) : Promise<void>;

    /**
     * Return the embedded client (mainly for logging purposes).
     * @returns {Client} The client.
     */
    public GetClient() : Client {
        return this._Client;
    }

    /**
     * Post-send hook.
     * @async
     */
    public AfterSend?(): Promise<void>;
}
