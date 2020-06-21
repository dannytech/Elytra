import { ReadableBuffer } from "./ReadableBuffer";

export class WritableBuffer {
    public Buffer: Buffer;

    constructor(buf?: Buffer) {
        this.Buffer = buf || Buffer.alloc(0);
    }

    public GetReadable() : ReadableBuffer {
        return new ReadableBuffer(this.Buffer);
    }

    public WriteByte(value: number, prepend: boolean = true) : void {
        this.Write(Buffer.from([ value ]), prepend);
    }

    public Write(value: Buffer, prepend: boolean = true) : void {
        if (prepend)
            Buffer.concat([ value, this.Buffer ]);
        else
            Buffer.concat([ this.Buffer, value ]);
    }

    public WriteBool(value: boolean, prepend: boolean = true) : void {
        this.WriteByte(value ? 0x1 : 0x0, prepend);
    }

    public WriteVarInt(value: number, prepend: boolean = true) : void {
        const temp: WritableBuffer = new WritableBuffer();

        do {
            let digit: number = value & 0b01111111;

            value >>>= 7;
            if (value != 0)
                digit |= 0b10000000;

            temp.WriteByte(digit);
        } while (value != 0);

        this.Write(temp.Buffer, prepend);
    }
    
    public WriteVarChar(value: string, prepend: boolean = true) : void {
        const temp: WritableBuffer = new WritableBuffer();
        temp.WriteVarInt(value.length);
        temp.Write(Buffer.from(value));

        this.Write(temp.Buffer, prepend);
    }
    
    public WriteChar(value: string, prepend: boolean = true) : void {
        this.WriteByte(value.charCodeAt(0), prepend);
    }

    public WriteUint16(value: number, prepend: boolean = true) : void {
        let buf: Buffer = Buffer.alloc(2);
        buf.writeUInt16BE(value);

        this.Write(buf, prepend);
    }

    public WriteUint32(value: number, prepend: boolean = true) : void {
        let buf: Buffer = Buffer.alloc(4);
        buf.writeUInt32BE(value);

        this.Write(buf, prepend);
    }

    public WriteUint64(value: bigint, prepend: boolean = true) : void {
        let buf: Buffer = Buffer.alloc(8);
        buf.writeBigUInt64BE(value);

        this.Write(buf, prepend);
    }

    public WriteInt16(value: number, prepend: boolean = true) : void {
        let buf: Buffer = Buffer.alloc(2);
        buf.writeInt16BE(value);

        this.Write(buf, prepend);
    }

    public WriteInt32(value: number, prepend: boolean = true) : void {
        let buf: Buffer = Buffer.alloc(4);
        buf.writeInt32BE(value);

        this.Write(buf, prepend);
    }

    public WriteInt64(value: bigint, prepend: boolean = true) : void {
        let buf: Buffer = Buffer.alloc(8);
        buf.writeBigInt64BE(value);

        this.Write(buf, prepend);
    }

    public WriteSingle(value: number, prepend: boolean = true) : void {
        let buf: Buffer = Buffer.alloc(4);
        buf.writeFloatBE(value);

        this.Write(buf, prepend);
    }

    public WriteDouble(value: number, prepend: boolean = true) : void {
        let buf: Buffer = Buffer.alloc(8);
        buf.writeDoubleBE(value);

        this.Write(buf, prepend);
    }
}