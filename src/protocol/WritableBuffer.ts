import { Logging, LoggingLevel } from "../game/Logging";
import { UUID } from "../game/UUID";
import { ChatComponent } from "../game/chat/ChatComponent";
import { ReadableBuffer } from "./ReadableBuffer";

export class WritableBuffer {
    private _Prepend: boolean;
    private _Buffer: Buffer;
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
     * Returns a readable buffer of the current buffer
     * @returns {ReadableBuffer} A readable version of the underlying buffer
     */
    public get ReadableBuffer(): ReadableBuffer {
        // Preserve range definitions
        return new ReadableBuffer(this._Buffer, this._Ranges);
    }

    constructor(buf?: Buffer, ranges?: Array<[number, string]>) {
        this._Prepend = false;
        this._Buffer = buf || Buffer.alloc(0);
        this._Ranges = ranges || [];
    }

    /**
     * Enables prepend mode for a single write operation
     * @returns {WritableBuffer} The current WritableBuffer with prepend mode enabled
     */
    public Prepend(): WritableBuffer {
        this._Prepend = true;

        return this;
    }

    /**
     * Writes multiple bytes to the buffer
     * @param {Buffer} value The buffer to write
     * @param {string} [annotation] The name of the region to be written
     */
    public Write(value: Buffer, annotation?: string) {
        const trace = Logging.Level() === LoggingLevel.TRACE;

        if (this._Prepend) {
            // Add range annotations to beginning
            if (trace)
                this._Ranges.unshift([ value.length, annotation ]);

            this._Buffer = Buffer.concat([ value, this._Buffer ]);
            this._Prepend = false;
        } else {
            // Add range annotations
            if (trace)
                this._Ranges.push([ value.length, annotation ]);

            this._Buffer = Buffer.concat([ this._Buffer, value ]);
        }
    }

    /**
     * Writes a length-prefixed buffer to the buffer
     * @param {Buffer} value The buffer to write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteBuffer(value: Buffer, annotation?: string) {
        this.WriteVarInt(value.length, annotation ? annotation + " Length" : undefined);
        this.Write(value, annotation);
    }

    /**
     * Writes a single byte to the buffer
     * @param {number} value The byte to write, in numerical form
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteByte(value: number, annotation?: string) {
        // Ensure only a single byte is written
        const buf = Buffer.alloc(1);
        buf.writeUInt8(value);

        this.Write(buf, annotation);
    }

    /**
     * Writes a signed byte to the buffer
     * @param {number} value The byte to write, in numerical form
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteSignedByte(value: number, annotation?: string) {
        // Ensure only a single byte is written
        const buf = Buffer.alloc(1);
        buf.writeInt8(value);

        this.Write(buf, annotation);
    }

    /**
     * Writes a single-byte bool to the buffer
     * @param {boolean} value The boolean to write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteBool(value: boolean, annotation?: string) {
        this.WriteByte(value ? 0x1 : 0x0, annotation);
    }

    /**
     * Writes a variable-length Minecraft VarInt to the buffer. (little-endian)
     * @param {number} value The number to convert and write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteVarInt(value: number, annotation?: string) {
        const temp: WritableBuffer = new WritableBuffer();

        do {
            // Get 7 lowest bits to write
            let digit: number = value & 0b01111111;

            // Shift away the lowest bits, moving the sign bit so that can be captured later
            value >>>= 7;

            // If there are more digits to write, set the continuation bit
            if (value != 0)
                digit |= 0b10000000;

            temp.WriteByte(digit);
        } while (value != 0);

        this.Write(temp.Buffer, annotation);
    }

    /**
     * Writes a variable-length Minecraft VarLong to the buffer (little-endian)
     * @param {bigint} value The bigint to convert and write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteVarLong(value: bigint, annotation?: string) {
        const temp: WritableBuffer = new WritableBuffer();

        // Calculate the two's complement for negative bigints (since the sign will not be shifted below)
        if (value < 0)
            value = (BigInt(1) << BigInt(64)) + value;

        do {
            // Get the 7 lowest bits to write
            let digit = Number(value & BigInt(0b01111111));

            // Shift away the lowest bits
            value = value >> BigInt(7);

            // If there are more digits to write, set the continuation bit
            if (value != BigInt(0))
                digit |= 0b10000000;

            temp.WriteByte(digit);
        } while (value != BigInt(0));

        this.Write(temp._Buffer, annotation);
    }

    /**
     * Writes a single-byte character to the buffer
     * @param {string} value The character to write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteChar(value: string, annotation?: string) {
        this.WriteByte(value.charCodeAt(0), annotation);
    }

    /**
     * Writes a length-prefixed string to the buffer
     * @param {string} value The string to write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteVarChar(value: string, annotation?: string) {
        this.WriteVarInt(value.length, annotation ? annotation + " Length" : undefined);
        this.Write(Buffer.from(value), annotation);
    }

    /**
     * Writes a two-byte positive integer to the buffer
     * @param {number} value The integer to write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteUint16(value: number, annotation?: string) {
        const buf: Buffer = Buffer.alloc(2);
        buf.writeUInt16BE(value);

        this.Write(buf, annotation);
    }

    /**
     * Writes a four-byte positive integer to the buffer
     * @param {number} value The integer to write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteUint32(value: number, annotation?: string) {
        const buf: Buffer = Buffer.alloc(4);
        buf.writeUInt32BE(value);

        this.Write(buf, annotation);
    }

    /**
     * Writes an eight-byte positive long integer to the buffer
     * @param {number} value The long integer to write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteUint64(value: bigint, annotation?: string) {
        const buf: Buffer = Buffer.alloc(8);
        buf.writeBigUInt64BE(value);

        this.Write(buf, annotation);
    }

    /**
     * Writes a two-byte positive or negative integer to the buffer
     * @param {number} value The integer to write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteInt16(value: number, annotation?: string) {
        const buf: Buffer = Buffer.alloc(2);
        buf.writeInt16BE(value);

        this.Write(buf, annotation);
    }

    /**
     * Writes a four-byte positive or negative integer to the buffer
     * @param {number} value The integer to write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteInt32(value: number, annotation?: string) {
        const buf: Buffer = Buffer.alloc(4);
        buf.writeInt32BE(value);

        this.Write(buf, annotation);
    }

    /**
     * Writes an eight-byte positive or negative long integer to the buffer
     * @param {number} value The long integer to write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteInt64(value: bigint, annotation?: string) {
        const buf: Buffer = Buffer.alloc(8);
        buf.writeBigInt64BE(value);

        this.Write(buf, annotation);
    }

    /**
     * Writes a four-byte float to the buffer
     * @param {number} value The float to write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteSingle(value: number, annotation?: string) {
        const buf: Buffer = Buffer.alloc(4);
        buf.writeFloatBE(value);

        this.Write(buf, annotation);
    }

    /**
     * Writes an eight-byte double to the buffer
     * @param {number} value The double to write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteDouble(value: number, annotation?: string) {
        const buf: Buffer = Buffer.alloc(8);
        buf.writeDoubleBE(value);

        this.Write(buf, annotation);
    }

    /**
     * Writes a stringified JSON object to the buffer as a VarChar
     * @param {object} value The JavaScript object to stringify and write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteJSON<T extends object>(value: T, annotation?: string) {
        this.WriteVarChar(JSON.stringify(value), annotation + " JSON");
    }

    /**
     * Converts and writes a Chat message to the buffer using WriteJSON
     * @param {ChatComponent} value The Chat message to convert and write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteChat(value: ChatComponent, annotation?: string) {
        this.WriteJSON(value, annotation + " Chat");
    }

    /**
     * Writes a Minecraft UUID to the buffer
     * @param {UUID} value The UUID to write
     * @param {string} [annotation] The name of the region to be written
     */
    public WriteUUID(value: UUID, annotation?: string) {
        const buf: WritableBuffer = new WritableBuffer();

        // Split the UUID into two bigints
        const uuid: string = value.Format();
        const msb = BigInt("0x" + uuid.substring(0, uuid.length / 2));
        const lsb = BigInt("0x" + uuid.substring(uuid.length / 2));

        // Write the 128-bit UUID
        buf.WriteUint64(msb);
        buf.WriteUint64(lsb);

        this.Write(buf.Buffer, annotation);
    }
}
