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
     * Reads the Minecraft VarInt packet length from the stream
     * @returns {number} The packet length
     * @throws If the VarInt is over 5 bytes long, an error will be thrown
     * @async
     */
    public async ReadPacketLength(): Promise<number> {
        let numRead = 0;
        let result = 0;
        let read: number;

        do {
            read = (await this.Read(1)).readUInt8();

            // Capture the lowest 7 bits from the VarInt byte
            const digit: number = (read & 0b01111111);

            // Shift bit bits to before existing blocks
            const value: number = (digit << (7 * numRead));

            // Insert the bits into the result
            result |= value;

            // Move the cursor forward
            numRead++;
            if (numRead > 5)
                throw new Error("VarInt is too long");
        } while ((read & 0b10000000) != 0);

        return result;
    }
}
