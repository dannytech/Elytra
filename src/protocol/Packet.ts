import { ReadableBuffer } from "./ReadableBuffer";
import { WritableBuffer } from "./WritableBuffer";
import { Client } from "./Client";

export interface IServerboundPacket {
    /**
     * Parses the packet, modifying game state and responding as needed.
     * @param {ReadableBuffer} buf The packet contents to parse.
     * @async
     */
    Parse(buf: ReadableBuffer) : Promise<void>;

    AfterReceive?() : Promise<void>;
}

export interface IClientboundPacket {
    /**
     * Writes the packet to a buffer.
     * @param {WritableBuffer} buf The buffer to be sent to the client.
     * @async
     */
    Write(buf: WritableBuffer) : Promise<void>;

    AfterSend?() : Promise<void>;
}

export abstract class ClientboundPacket {
    public Client: Client;

    constructor(client: Client) {
        this.Client = client;
    }

    /**
     * Writes the packet to a buffer.
     * @param {WritableBuffer} buf The buffer to be sent to the client.
     * @async
     */
    public abstract Write(buf: WritableBuffer) : Promise<void>;

    public AfterSend?() : Promise<void>;
}
