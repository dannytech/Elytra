import { Logging, LoggingLevel } from "../game/Logging.js";
import { UUID } from "../game/UUID.js";
import { ChatComponent } from "../game/chat/ChatComponent.js";
import { WritableBuffer } from "./WritableBuffer.js";

export class ReadableBuffer {
    private _Buffer: Buffer;
    private _Cursor: number;
    private _Ranges: Array<[number, string]>;

    /**
     * Returns the current buffer
     * @returns {Buffer} The underlying buffer
     */
    public get Buffer(): Buffer {
        return this._Buffer;
    }

    /**
     * Returns an array of annotated ranges for tracing
     * @returns {Array<[Buffer, string]>}
     */
    public get Ranges(): Array<[Buffer, string]> {
        const buf = new ReadableBuffer(this._Buffer);

        // Convert the ranges into a list of annotated buffers
        return this._Ranges.map((range: [number, string]) => {
            const [size, annotation] = range;

            // Safely read the described ranges
            return [buf.Read(size), annotation];
        });
    }

    /**
     * Returns a writable buffer of the current buffer
     * @returns {WritableBuffer} A writable version of the underlying buffer
     */
    public get WritableBuffer(): WritableBuffer {
        // Preserve range definitions
        return new WritableBuffer(this._Buffer, this._Ranges);
    }

    constructor(buf: Buffer, ranges?: Array<[number, string]>) {
        this._Buffer = buf;
        this._Cursor = 0;
        this._Ranges = ranges || [];
    }

    /**
     * Reads the specified amount of bytes from the buffer, or all the remaining unread bytes
     * @param {number | string} [bytesOrAnnotation] The amount of bytes to read, all remaining bytes read if omitted
     * @param {string} [annotation] The name of the region to be read
     * @returns {Buffer} A new buffer containing the subset of bytes read
     */
    public Read(bytesOrAnnotation?: number | string , annotation?: string): Buffer {
        if (typeof bytesOrAnnotation == "string") {
            annotation = bytesOrAnnotation;
            bytesOrAnnotation = null;
        }

        const trace = Logging.Level() == LoggingLevel.TRACE;

        if (bytesOrAnnotation == null)
            bytesOrAnnotation = this._Buffer.length - this._Cursor;
        else bytesOrAnnotation = bytesOrAnnotation as number;

        // Alert if there was a buffer overrun, this really shouldn't happen
        if (bytesOrAnnotation + this._Cursor > this._Buffer.length)
            Logging.Debug("ReadableBuffer attempted to read past the end of the buffer. This could cause issues parsing packets correctly.".red.bold);

        // Add range annotations
        if (trace)
            this._Ranges.push([ bytesOrAnnotation, annotation ]);

        return this._Buffer.slice(this._Cursor, this._Cursor += bytesOrAnnotation);
    }

    /**
     * Reads a buffer length and then the bytes from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {Buffer} The buffer, as specified by the length header
     */
    public ReadBuffer(annotation?: string): Buffer {
        const bytes: number = this.ReadVarInt(annotation + " Length");

        return this.Read(bytes, annotation);
    }

    /**
     * Reads a single byte from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {number} The byte, between 0 and 255
     */
    public ReadByte(annotation?: string): number {
        return this.Read(1, annotation)[0];
    }

    /**
     * Reads a single signed byte from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {number} The signed byte, between -128 and 127
     */
    public ReadSignedByte(annotation?: string): number {
        const byte = this.ReadByte(annotation);

        // Calculate the two's complement of the byte if the sign bit is set
        if (byte & 0x80)
            return byte - 256;
        else return byte;
    }

    /**
     * Reads a single-byte bool from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {boolean} The boolean
     */
    public ReadBool(annotation?: string): boolean {
        return this.ReadByte(annotation) > 0;
    }

    /**
     * Reads a Minecraft VarInt from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {number} The converted number
     * @throws If the VarInt is over 5 bytes long, an error will be thrown
     */
    public ReadVarInt(annotation?: string): number {
        let numRead = 0;
        let result = 0;
        let read: number;

        do {
            read = this.ReadByte();

            // Capture the lowest 7 bits from the VarInt byte
            const digit: number = (read & 0b01111111);

            // Shift the bits to before existing blocks
            const value: number = (digit << (7 * numRead));

            // Insert the bits into the result
            result |= value;

            // Move the cursor forward
            numRead++;
            if (numRead > 5)
                throw new Error("VarInt is too long");
        } while ((read & 0b10000000) != 0);

        // Replace existing annotations with a single annotation
        const trace = Logging.Level() === LoggingLevel.TRACE;
        if (trace) {
            this._Ranges.splice(this._Ranges.length - numRead, numRead);
            this._Ranges.push([ numRead, annotation ]);
        }

        return result;
    }

    /**
     * Reads a Minecraft VarLong from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {bigint} The converted bigint
     * @throws If the VarInt is over 5 bytes long, an error will be thrown
     */
    public ReadVarLong(annotation?: string): bigint {
        let numRead = 0;
        let result = BigInt(0);
        let read: number;
        let msb: number;

        do {
            read = this.ReadByte();

            // Capture the lowest 7 bits from the VarLong byte
            const digit = BigInt(read & 0b01111111);

            // Shift the bits to before existing blocks
            const value = BigInt(digit << BigInt(7 * numRead));

            // Insert the bits into the result
            result |= value;

            // Save the MSB to check for a sign bit later
            if (numRead == 0)
                msb = read;

            // Move the cursor forward
            numRead++;
            if (numRead > 10)
                throw new Error("VarInt is too long");
        } while ((read & 0b10000000) != 0);

        // If the sign bit is set, compute the two's complement of the result and negate it
        if (numRead == 10 && (msb & 0b10000000) != 0)
            result = -((BigInt(1) << BigInt(64)) - result);

        // Replace existing annotations with a single annotation
        const trace = Logging.Level() === LoggingLevel.TRACE;
        if (trace) {
            this._Ranges.splice(this._Ranges.length - numRead, numRead);
            this._Ranges.push([ numRead, annotation ]);
        }

        return result;
    }

    /**
     * Reads a length-prefixed string from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {string} The string
     */
    public ReadVarChar(annotation?: string): string {
        const bytes: number = this.ReadVarInt(annotation + " Length");

        return this.Read(bytes, annotation).toString();
    }

    /**
     * Reads a single-byte character from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {string} The single character, wrapped in a string
     */
    public ReadChar(annotation?: string): string {
        return String.fromCharCode(this.ReadByte(annotation));
    }

    /**
     * Reads a stringified JSON from a VarChar from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {object} The parsed object
     */
    public ReadJSON<T extends object>(annotation?: string): T {
        return JSON.parse(this.ReadVarChar(annotation + " JSON")) as T;
    }

    /**
     * Reads a Chat component from the buffer using ReadJSON
     * @param {string} [annotation] The name of the region to be read
     * @returns {ChatComponent} The parsed ChatComponent
     */
    public ReadChat(annotation?: string): ChatComponent {
        return this.ReadJSON(annotation + " Chat");
    }

    /**
     * Reads a two-byte positive integer from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {number} The integer
     */
    public ReadUint16(annotation?: string): number {
        return this.Read(2, annotation).readUInt16BE();
    }

    /**
     * Reads a four-byte positive integer from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {number} The integer
     */
    public ReadUint32(annotation?: string): number {
        return this.Read(4, annotation).readUInt32BE();
    }

    /**
     * Reads an eight-byte positive long integer from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {bigint} The long integer
     */
    public ReadUint64(annotation?: string): bigint {
        return this.Read(8, annotation).readBigUInt64BE();
    }

    /**
     * Reads a two-byte positive or negative integer from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {number} The integer
     */
    public ReadInt16(annotation?: string): number {
        return this.Read(2, annotation).readInt16BE();
    }

    /**
     * Reads a four-byte positive or negative integer from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {number} The integer
     */
    public ReadInt32(annotation?: string): number {
        return this.Read(4, annotation).readInt32BE();
    }

    /**
     * Reads an eight-byte positive or negative long integer from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {number} The long integer
     */
    public ReadInt64(annotation?: string): bigint {
        return this.Read(8, annotation).readBigInt64BE();
    }

    /**
     * Reads a four-byte float from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {number} The float
     */
    public ReadSingle(annotation?: string): number {
        return this.Read(4, annotation).readFloatBE();
    }

    /**
     * Reads an eight-byte double from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {number} The double
     */
    public ReadDouble(annotation?: string): number {
        return this.Read(8, annotation).readDoubleBE();
    }

    /**
     * Reads a Minecraft UUID from the buffer
     * @param {string} [annotation] The name of the region to be read
     * @returns {UUID} The UUID
     */
    public ReadUUID(annotation?: string): UUID {
        const buf = new ReadableBuffer(this.Read(16, annotation));

        // Read the UUID in two parts
        const msb: bigint = buf.ReadUint64();
        const lsb: bigint = buf.ReadUint64();

        // Convert and concatenate the parts to create a UUID
        return new UUID(msb.toString(16) + lsb.toString(16));
    }
}
