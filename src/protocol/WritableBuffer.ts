import { ReadableBuffer } from "./ReadableBuffer";

export class WritableBuffer {
    private _Prepend: boolean;

    public Buffer: Buffer;

    constructor(buf?: Buffer) {
        this._Prepend = false;

        this.Buffer = buf || Buffer.alloc(0);
    }

    public Prepend() : WritableBuffer {
        this._Prepend = true;

        return this;
    }

    public GetReadable() : ReadableBuffer {
        return new ReadableBuffer(this.Buffer);
    }

    public WriteByte(value: number) : void {
        this.Write(Buffer.from([ value ]));
    }

    public Write(value: Buffer) : void {
        if (this._Prepend) {
            this.Buffer = Buffer.concat([ value, this.Buffer ]);
            this._Prepend = false;
        } else
            this.Buffer = Buffer.concat([ this.Buffer, value ]);
    }

    public WriteBool(value: boolean) : void {
        this.WriteByte(value ? 0x1 : 0x0);
    }

    public WriteVarInt(value: number) : void {
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
    
    public WriteVarChar(value: string) : void {
        const temp: WritableBuffer = new WritableBuffer();
        temp.WriteVarInt(value.length);
        temp.Write(Buffer.from(value));

        this.Write(temp.Buffer);
    }
    
    public WriteChar(value: string) : void {
        this.WriteByte(value.charCodeAt(0));
    }

    public WriteJSON(value: object) : void {
        this.WriteVarChar(JSON.stringify(value));
    }

    public WriteUint16(value: number) : void {
        let buf: Buffer = Buffer.alloc(2);
        buf.writeUInt16BE(value);

        this.Write(buf);
    }

    public WriteUint32(value: number) : void {
        let buf: Buffer = Buffer.alloc(4);
        buf.writeUInt32BE(value);

        this.Write(buf);
    }

    public WriteUint64(value: bigint) : void {
        let buf: Buffer = Buffer.alloc(8);
        buf.writeBigUInt64BE(value);

        this.Write(buf);
    }

    public WriteInt16(value: number) : void {
        let buf: Buffer = Buffer.alloc(2);
        buf.writeInt16BE(value);

        this.Write(buf);
    }

    public WriteInt32(value: number) : void {
        let buf: Buffer = Buffer.alloc(4);
        buf.writeInt32BE(value);

        this.Write(buf);
    }

    public WriteInt64(value: bigint) : void {
        let buf: Buffer = Buffer.alloc(8);
        buf.writeBigInt64BE(value);

        this.Write(buf);
    }

    public WriteSingle(value: number) : void {
        let buf: Buffer = Buffer.alloc(4);
        buf.writeFloatBE(value);

        this.Write(buf);
    }

    public WriteDouble(value: number) : void {
        let buf: Buffer = Buffer.alloc(8);
        buf.writeDoubleBE(value);

        this.Write(buf);
    }
}
