import { UUID } from "../game/UUID";
import { ReadableBuffer } from "./ReadableBuffer";

export class WritableBuffer {
    private _Prepend: boolean;

    public Buffer: Buffer;

    constructor(buf?: Buffer) {
        this._Prepend = false;

        this.Buffer = buf || Buffer.alloc(0);
    }

    /**
     * Exports a ReadableBuffer from the written data.
     * @returns {ReadableBuffer} A readable representation of the written data.
     */
    public GetReadable() : ReadableBuffer {
        return new ReadableBuffer(this.Buffer);
    }

    /**
     * Enables prepend mode for a single write operation.
     * @returns {WritableBuffer} The current WritableBuffer with prepend mode enabled.
     */
    public Prepend() : WritableBuffer {
        this._Prepend = true;

        return this;
    }

    /**
     * Writes multiple bytes to the buffer.
     * @param {Buffer} value The buffer to write.
     */
    public Write(value: Buffer) {
        if (this._Prepend) {
            this.Buffer = Buffer.concat([ value, this.Buffer ]);
            this._Prepend = false;
        } else
            this.Buffer = Buffer.concat([ this.Buffer, value ]);
    }

    /**
     * Writes a single-byte bool to the buffer.
     * @param {boolean} value The boolean to write.
     */
    public WriteBool(value: boolean) {
        this.WriteByte(value ? 0x1 : 0x0);
    }

    /**
     * Writes a single byte to the buffer.
     * @param {number} value The byte to write, in numerical form.
     */
    public WriteByte(value: number) {
        this.Write(Buffer.from([ value ]));
    }

    /**
     * Writes a variable-length Minecraft VarInt to the buffer.
     * @param {number} value The number to convert and write.
     */
    public WriteVarInt(value: number) {
        const temp: WritableBuffer = new WritableBuffer();

        do {
            let digit: number = value & 0b01111111;

            value >>>= 7;
            if (value != 0)
                digit |= 0b10000000;

            temp.WriteByte(digit);
        } while (value != 0);

        this.Write(temp.Buffer);
    }

    /**
     * Writes a variable-length Minecraft VarLong to the buffer.
     * Note that writing bigints is currently unsupported, and they are truncated on write.
     * @param {bigint} value The bigint to convert and write.
     */
    public WriteVarLong(value: bigint) {
        this.WriteVarInt(Number(value));
    }

    /**
     * Writes a length-prefixed string to the buffer.
     * @param {string} value The string to write.
     */
    public WriteVarChar(value: string) {
        const temp: WritableBuffer = new WritableBuffer();
        temp.WriteVarInt(value.length);
        temp.Write(Buffer.from(value));

        this.Write(temp.Buffer);
    }

    /**
     * Writes a single-byte character to the buffer.
     * @param {string} value The character to write.
     */
    public WriteChar(value: string) {
        this.WriteByte(value.charCodeAt(0));
    }

    /**
     * Writes a stringified JSON object to the buffer as a VarChar.
     * @param {object} value The JavaScript object to stringify and write.
     */
    public WriteJSON(value: object) {
        this.WriteVarChar(JSON.stringify(value));
    }

    /**
     * Writes a two-byte positive integer to the buffer.
     * @param {number} value The integer to write.
     */
    public WriteUint16(value: number) {
        const buf: Buffer = Buffer.alloc(2);
        buf.writeUInt16BE(value);

        this.Write(buf);
    }

    /**
     * Writes a four-byte positive integer to the buffer.
     * @param {number} value The integer to write.
     */
    public WriteUint32(value: number) {
        const buf: Buffer = Buffer.alloc(4);
        buf.writeUInt32BE(value);

        this.Write(buf);
    }

    /**
     * Writes an eight-byte positive long integer to the buffer.
     * @param {number} value The long integer to write.
     */
    public WriteUint64(value: bigint) {
        const buf: Buffer = Buffer.alloc(8);
        buf.writeBigUInt64BE(value);

        this.Write(buf);
    }

    /**
     * Writes a two-byte positive or negative integer to the buffer.
     * @param {number} value The integer to write.
     */
    public WriteInt16(value: number) {
        const buf: Buffer = Buffer.alloc(2);
        buf.writeInt16BE(value);

        this.Write(buf);
    }

    /**
     * Writes a four-byte positive or negative integer to the buffer.
     * @param {number} value The integer to write.
     */
    public WriteInt32(value: number) {
        const buf: Buffer = Buffer.alloc(4);
        buf.writeInt32BE(value);

        this.Write(buf);
    }

    /**
     * Writes an eight-byte positive or negative long integer to the buffer.
     * @param {number} value The long integer to write.
     */
    public WriteInt64(value: bigint) {
        const buf: Buffer = Buffer.alloc(8);
        buf.writeBigInt64BE(value);

        this.Write(buf);
    }

    /**
     * Writes a four-byte float to the buffer.
     * @param {number} value The float to write.
     */
    public WriteSingle(value: number) {
        const buf: Buffer = Buffer.alloc(4);
        buf.writeFloatBE(value);

        this.Write(buf);
    }

    /**
     * Writes an eight-byte double to the buffer.
     * @param {number} value The double to write.
     */
    public WriteDouble(value: number) {
        const buf: Buffer = Buffer.alloc(8);
        buf.writeDoubleBE(value);

        this.Write(buf);
    }

    /**
     * Writes a Minecraft UUID to the buffer.
     * @param {UUID} value The UUID to write.
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
