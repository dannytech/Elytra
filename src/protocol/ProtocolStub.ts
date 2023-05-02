import { Duplex } from "stream";

export class ProtocolStub {
    private _Stream: Duplex;

    constructor(stream: Duplex) {
        this._Stream = stream;
    }

    /**
     * Returns the full-duplex stream being read from
     * @returns {Duplex} The underlying stream
     */
    public get Stream(): Duplex {
        return this._Stream;
    }

    /**
     * Reads the specified amount of bytes from the buffer, blocking until fulfilled
     * @param {number} bytes The amount of bytes to read
     * @returns {ReadableBuffer} A ReadableBuffer containing the bytes read
     * @throws 
     * @async
     */
    public async Read(bytes: number): Promise<Buffer> {
        const buf: Buffer = this._Stream.read(bytes);

        // If the buffer is empty (null), wait for more data
        if (buf) return buf;
        else return new Promise<Buffer>((resolve) => {
            // Wait for more data and try again
            const handler = async () => resolve(await this.Read(bytes));
            this._Stream.once("readable", handler);
        });
    }

    /**
     * Reads a variable-length Minecraft VarInt from the buffer
     * @returns {number} The converted number
     * @throws If the VarInt is over 5 bytes long, an error will be thrown
     * @async
     */
    public async ReadVarInt(): Promise<number> {
        let numRead = 0;
        let result = 0;
        let read: number;

        do {
            read = (await this.Read(1)).readUInt8();
            const value: number = (read & 0b01111111);
            result |= (value << (7 * numRead));

            numRead++;
            if (numRead > 5)
                throw new Error("VarInt is too long");
        } while ((read & 0b10000000) != 0);

        return result;
    }
}
