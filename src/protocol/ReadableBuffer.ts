import { Console } from "../game/Console";
import { UUID } from "../game/UUID";
import { WritableBuffer } from "./WritableBuffer";

export class ReadableBuffer {
    public Cursor: number;
    public Buffer: Buffer;

    constructor(buf: Buffer) {
        this.Buffer = buf;
        this.Cursor = 0;
    }

    /**
     * Exports a WriteableBuffer of the buffer's contents.
     * @returns {WritableBuffer} A writable representation of the buffer.
     */
    public GetWritable() : WritableBuffer {
        return new WritableBuffer(this.Buffer);
    }

    /**
     * Skips the specified amount of bytes in the buffer.
     * @param {number} [bytes] The amount of bytes to skip.
     */
    public Skip(bytes: number) {
        this.Cursor += bytes;
    }

    /**
     * Reads a single byte from the buffer.
     * @returns {number} The byte, represented as a number in the range 0-255.
     */
    public ReadByte() : number {
        return this.Read(1)[0];
    }

    /**
     * Reads the specified amount of bytes from the buffer, or all the remaining unread bytes.
     * @param {number} [bytes] The amount of bytes to read.
     * @returns {Buffer} A new buffer containing the subset of bytes read.
     */
    public Read(bytes?: number) : Buffer {
        bytes = bytes || this.Buffer.length - this.Cursor;

        // Alert if there was a buffer overrun, this really shouldn't happen
        if (bytes + this.Cursor > this.Buffer.length)
            Console.Debug("ReadableBuffer attempted to read past the end of the buffer. This could cause issues parsing packets correctly.".red.bold);

        return this.Buffer.slice(this.Cursor, this.Cursor += bytes);
    }

    /**
     * Reads a single-byte bool from the buffer.
     * @returns {boolean} The boolean.
     */
    public ReadBool() : boolean {
        return this.ReadByte() > 0;
    }

    /**
     * Reads a variable-length Minecraft VarInt from the buffer.
     * @returns {number} The converted number.
     * @throws If the VarInt is over 5 bytes long, an error will be thrown.
     */
    public ReadVarInt() : number {
        let numRead = 0;
        let result = 0;
        let read: number;

        do {
            read = this.ReadByte();
            const value: number = (read & 0b01111111);
            result |= (value << (7 * numRead));

            numRead++;
            if (numRead > 5)
                throw new Error("VarInt is too long");
        } while ((read & 0b10000000) != 0);

        return result;
    }

    /**
     * Reads a variable-length Minecraft VarLong from the buffer.
     * Note that reading bigints is currently unsupported, so normal VarInts are read.
     * @returns {bigint} The converted bigint.
     */
    public ReadVarLong() : bigint {
        return BigInt(this.ReadVarInt());
    }

    /**
     * Reads a length-prefixed string from the buffer.
     * @returns {string} The string.
     */
    public ReadVarChar() : string {
        const bytes: number = this.ReadVarInt();

        return this.Read(bytes).toString();
    }

    /**
     * Reads a single-byte character from the buffer.
     * @returns {string} The single character, wrapped in a string.
     */
    public ReadChar() : string {
        return String.fromCharCode(this.ReadByte());
    }

    /**
     * Reads a stringified JSON from a VarChar from the buffer.
     * @returns {object} The parsed object.
     */
    public ReadJSON() : object {
        return JSON.parse(this.ReadVarChar());
    }

    /**
     * Reads a two-byte positive integer from the buffer.
     * @returns {number} The integer.
     */
    public ReadUint16() : number {
        return this.Read(2).readUInt16BE();
    }

    /**
     * Reads a four-byte positive integer from the buffer.
     * @returns {number} The integer.
     */
    public ReadUint32() : number {
        return this.Read(4).readUInt32BE();
    }

    /**
     * Reads an eight-byte positive long integer from the buffer.
     * @returns {bigint} The long integer.
     */
    public ReadUint64() : bigint {
        return this.Read(8).readBigUInt64BE();
    }

    /**
     * Reads a two-byte positive or negative integer from the buffer.
     * @returns {number} The integer.
     */
    public ReadInt16() : number {
        return this.Read(2).readInt16BE();
    }

    /**
     * Reads a four-byte positive or negative integer from the buffer.
     * @returns {number} The integer.
     */
    public ReadInt32() : number {
        return this.Read(4).readInt32BE();
    }

    /**
     * Reads an eight-byte positive or negative long integer from the buffer.
     * @returns {number} The long integer.
     */
    public ReadInt64() : bigint {
        return this.Read(8).readBigInt64BE();
    }

    /**
     * Reads a four-byte float from the buffer.
     * @returns {number} The float.
     */
    public ReadSingle() : number {
        return this.Read(4).readFloatBE();
    }

    /**
     * Reads an eight-byte double from the buffer.
     * @returns {number} The double.
     */
    public ReadDouble() : number {
        return this.Read(8).readDoubleBE();
    }

    /**
     * Reads a Minecraft UUID from the buffer.
     * @returns {UUID} The UUID.
     */
    public ReadUUID() : UUID {
        // Read the UUID in two parts
        const msb: bigint = this.ReadUint64();
        const lsb: bigint = this.ReadUint64();

        // Convert and concatenate the parts to create a UUID
        return new UUID(msb.toString(16) + lsb.toString(16));
    }
}
