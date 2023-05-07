import { UUID } from "../game/UUID";
import { ReadableBuffer } from "./ReadableBuffer";

export class WritableBuffer {
    private _Prepend: boolean;
    private _Buffer: Buffer;

    /**
     * Returns the current buffer
     * @returns {Buffer} The underlying buffer
     */
    public get Buffer(): Buffer {
        return this._Buffer;
    }

    /**
     * Returns a readable buffer of the current buffer
     * @returns {ReadableBuffer} A readable version of the underlying buffer
     */
    public get ReadableBuffer(): ReadableBuffer {
        return new ReadableBuffer(this._Buffer);
    }

    constructor(buf?: Buffer) {
        this._Prepend = false;
        this._Buffer = buf || Buffer.alloc(0);
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
     */
    public Write(value: Buffer) {
        if (this._Prepend) {
            this._Buffer = Buffer.concat([ value, this._Buffer ]);
            this._Prepend = false;
        } else
            this._Buffer = Buffer.concat([ this._Buffer, value ]);
    }

    /**
     * Writes a single byte to the buffer
     * @param {number} value The byte to write, in numerical form
     */
    public WriteByte(value: number) {
        // Ensure only a single byte is written
        const buf = Buffer.alloc(1);
        buf.writeUInt8(value);

        this.Write(buf);
    }

    /**
     * Writes a signed byte to the buffer
     * @param {number} value The byte to write, in numerical form
     */
    public WriteSignedByte(value: number) {
        // Ensure only a single byte is written
        const buf = Buffer.alloc(1);
        buf.writeInt8(value);

        this.Write(buf);
    }

    /**
     * Writes a single-byte bool to the buffer
     * @param {boolean} value The boolean to write
     */
    public WriteBool(value: boolean) {
        this.WriteByte(value ? 0x1 : 0x0);
    }

    /**
     * Writes a variable-length Minecraft VarInt to the buffer. (little-endian)
     * @param {number} value The number to convert and write
     */
    public WriteVarInt(value: number) {
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

        this.Write(temp.Buffer);
    }

    /**
     * Writes a variable-length Minecraft VarLong to the buffer (little-endian)
     * @param {bigint} value The bigint to convert and write
     */
    public WriteVarLong(value: bigint) {
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

        this.Write(temp._Buffer);
    }

    /**
     * Writes a single-byte character to the buffer
     * @param {string} value The character to write
     */
    public WriteChar(value: string) {
        this.WriteByte(value.charCodeAt(0));
    }

    /**
     * Writes a length-prefixed string to the buffer
     * @param {string} value The string to write
     */
    public WriteVarChar(value: string) {
        const temp: WritableBuffer = new WritableBuffer();
        temp.WriteVarInt(value.length);
        temp.Write(Buffer.from(value));

        this.Write(temp._Buffer);
    }

    /**
     * Writes a two-byte positive integer to the buffer
     * @param {number} value The integer to write
     */
    public WriteUint16(value: number) {
        const buf: Buffer = Buffer.alloc(2);
        buf.writeUInt16BE(value);

        this.Write(buf);
    }

    /**
     * Writes a four-byte positive integer to the buffer
     * @param {number} value The integer to write
     */
    public WriteUint32(value: number) {
        const buf: Buffer = Buffer.alloc(4);
        buf.writeUInt32BE(value);

        this.Write(buf);
    }

    /**
     * Writes an eight-byte positive long integer to the buffer
     * @param {number} value The long integer to write
     */
    public WriteUint64(value: bigint) {
        const buf: Buffer = Buffer.alloc(8);
        buf.writeBigUInt64BE(value);

        this.Write(buf);
    }

    /**
     * Writes a two-byte positive or negative integer to the buffer
     * @param {number} value The integer to write
     */
    public WriteInt16(value: number) {
        const buf: Buffer = Buffer.alloc(2);
        buf.writeInt16BE(value);

        this.Write(buf);
    }

    /**
     * Writes a four-byte positive or negative integer to the buffer
     * @param {number} value The integer to write
     */
    public WriteInt32(value: number) {
        const buf: Buffer = Buffer.alloc(4);
        buf.writeInt32BE(value);

        this.Write(buf);
    }

    /**
     * Writes an eight-byte positive or negative long integer to the buffer
     * @param {number} value The long integer to write
     */
    public WriteInt64(value: bigint) {
        const buf: Buffer = Buffer.alloc(8);
        buf.writeBigInt64BE(value);

        this.Write(buf);
    }

    /**
     * Writes a four-byte float to the buffer
     * @param {number} value The float to write
     */
    public WriteSingle(value: number) {
        const buf: Buffer = Buffer.alloc(4);
        buf.writeFloatBE(value);

        this.Write(buf);
    }

    /**
     * Writes an eight-byte double to the buffer
     * @param {number} value The double to write
     */
    public WriteDouble(value: number) {
        const buf: Buffer = Buffer.alloc(8);
        buf.writeDoubleBE(value);

        this.Write(buf);
    }

    /**
     * Writes a stringified JSON object to the buffer as a VarChar
     * @param {object} value The JavaScript object to stringify and write
     */
    public WriteJSON(value: object) {
        this.WriteVarChar(JSON.stringify(value));
    }

    /**
     * Writes a Minecraft UUID to the buffer
     * @param {UUID} value The UUID to write
     */
    public WriteUUID(value: UUID) {
        // Split the UUID into two bigints
        const uuid: string = value.Format();
        const msb = BigInt("0x" + uuid.substring(0, uuid.length / 2));
        const lsb = BigInt("0x" + uuid.substring(uuid.length / 2));

        // Write the 128-bit UUID
        this.WriteUint64(msb);
        this.WriteUint64(lsb);
    }
}
