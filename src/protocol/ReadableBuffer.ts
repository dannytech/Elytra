import { Console } from "../game/Console";
import { UUID } from "../game/UUID";
import { WritableBuffer } from "./WritableBuffer";

export class ReadableBuffer {
    private _Buffer: Buffer;
    private _Cursor: number;

    /**
     * Returns the current buffer
     * @returns {Buffer} The underlying buffer
     */
    public get Buffer(): Buffer {
        return this._Buffer;
    }

    /**
     * Returns a writable buffer of the current buffer
     * @returns {WritableBuffer} A writable version of the underlying buffer
     */
    public get WritableBuffer(): WritableBuffer {
        return new WritableBuffer(this._Buffer);
    }

    constructor(buf: Buffer) {
        this._Buffer = buf;
        this._Cursor = 0;
    }

    /**
     * Reads the specified amount of bytes from the buffer, or all the remaining unread bytes
     * @param {number} [bytes] The amount of bytes to read
     * @returns {Buffer} A new buffer containing the subset of bytes read
     */
    public Read(bytes?: number): Buffer {
        bytes = bytes || this._Buffer.length - this._Cursor;

        // Alert if there was a buffer overrun, this really shouldn't happen
        if (bytes + this._Cursor > this._Buffer.length)
            Console.Debug("ReadableBuffer attempted to read past the end of the buffer. This could cause issues parsing packets correctly.".red.bold);

        return this._Buffer.slice(this._Cursor, this._Cursor += bytes);
    }

    /**
     * Reads a single byte from the buffer
     * @returns {number} The byte, between 0 and 255
     */
    public ReadByte(): number {
        return this.Read(1)[0];
    }

    /**
     * Reads a single signed byte from the buffer
     * @returns {number} The signed byte, between -128 and 127
     */
    public ReadSignedByte(): number {
        const byte = this.ReadByte();

        // Calculate the two's complement of the byte if the sign bit is set
        if (byte & 0x80)
            return byte - 256;
        else return byte;
    }

    /**
     * Reads a single-byte bool from the buffer
     * @returns {boolean} The boolean
     */
    public ReadBool(): boolean {
        return this.ReadByte() > 0;
    }

    /**
     * Reads a Minecraft VarInt from the buffer
     * @returns {number} The converted number
     * @throws If the VarInt is over 5 bytes long, an error will be thrown
     */
    public ReadVarInt(): number {
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

        return result;
    }

    /**
     * Reads a Minecraft VarLong from the buffer
     * @returns {bigint} The converted bigint
     */
    public ReadVarLong(): bigint {
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

        return result;
    }

    /**
     * Reads a length-prefixed string from the buffer
     * @returns {string} The string
     */
    public ReadVarChar(): string {
        const bytes: number = this.ReadVarInt();

        return this.Read(bytes).toString();
    }

    /**
     * Reads a single-byte character from the buffer
     * @returns {string} The single character, wrapped in a string
     */
    public ReadChar(): string {
        return String.fromCharCode(this.ReadByte());
    }

    /**
     * Reads a stringified JSON from a VarChar from the buffer
     * @returns {object} The parsed object
     */
    public ReadJSON(): object {
        return JSON.parse(this.ReadVarChar());
    }

    /**
     * Reads a two-byte positive integer from the buffer
     * @returns {number} The integer
     */
    public ReadUint16(): number {
        return this.Read(2).readUInt16BE();
    }

    /**
     * Reads a four-byte positive integer from the buffer
     * @returns {number} The integer
     */
    public ReadUint32(): number {
        return this.Read(4).readUInt32BE();
    }

    /**
     * Reads an eight-byte positive long integer from the buffer
     * @returns {bigint} The long integer
     */
    public ReadUint64(): bigint {
        return this.Read(8).readBigUInt64BE();
    }

    /**
     * Reads a two-byte positive or negative integer from the buffer
     * @returns {number} The integer
     */
    public ReadInt16(): number {
        return this.Read(2).readInt16BE();
    }

    /**
     * Reads a four-byte positive or negative integer from the buffer
     * @returns {number} The integer
     */
    public ReadInt32(): number {
        return this.Read(4).readInt32BE();
    }

    /**
     * Reads an eight-byte positive or negative long integer from the buffer
     * @returns {number} The long integer
     */
    public ReadInt64(): bigint {
        return this.Read(8).readBigInt64BE();
    }

    /**
     * Reads a four-byte float from the buffer
     * @returns {number} The float
     */
    public ReadSingle(): number {
        return this.Read(4).readFloatBE();
    }

    /**
     * Reads an eight-byte double from the buffer
     * @returns {number} The double
     */
    public ReadDouble(): number {
        return this.Read(8).readDoubleBE();
    }

    /**
     * Reads a Minecraft UUID from the buffer
     * @returns {UUID} The UUID
     */
    public ReadUUID(): UUID {
        // Read the UUID in two parts
        const msb: bigint = this.ReadUint64();
        const lsb: bigint = this.ReadUint64();

        // Convert and concatenate the parts to create a UUID
        return new UUID(msb.toString(16) + lsb.toString(16));
    }
}
