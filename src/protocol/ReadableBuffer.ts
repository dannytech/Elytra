import { WritableBuffer } from "./WritableBuffer";

export class ReadableBuffer {
    public Cursor: number;
    public Buffer: Buffer;

    constructor(buf: Buffer) {
        this.Buffer = buf;
        this.Cursor = 0;
    }

    public GetWritable() : WritableBuffer {
        return new WritableBuffer(this.Buffer);
    }

    public ReadByte() : number {
        return this.Read(1)[0];
    }

    public Read(bytes?: number) : Buffer {
        bytes = bytes || this.Buffer.length - this.Cursor;
        
        return this.Buffer.slice(this.Cursor, this.Cursor += bytes);
    }

    public ReadBool() : boolean {
        return this.ReadByte() > 0;
    }

    public ReadVarInt() : number {
        let numRead: number = 0;
        let result: number = 0;
        let read: number;

        do {
            read = this.ReadByte();
            let value: number = (read & 0b01111111);
            result |= (value << (7 * numRead));

            numRead++;
        } while ((read & 0b10000000) != 0);

        return result;
    }

    public ReadVarChar() : string {
        let bytes: number = this.ReadVarInt();

        return this.Read(bytes).toString();
    }

    public ReadChar() : string {
        return String.fromCharCode(this.ReadByte());
    }

    public ReadJSON() : object {
        return JSON.parse(this.ReadVarChar());
    }

    public ReadUint16() : number {
        return this.Read(2).readUInt16BE();
    }

    public ReadUint32() : number {
        return this.Read(4).readUInt32BE();
    }

    public ReadUint64() : bigint {
        return this.Read(8).readBigUInt64BE();
    }

    public ReadInt16() : number {
        return this.Read(2).readInt16BE();
    }

    public ReadInt32() : number {
        return this.Read(4).readInt32BE();
    }

    public ReadInt64() : bigint {
        return this.Read(8).readBigInt64BE();
    }

    public ReadSingle() : number {
        return this.Read(4).readFloatBE();
    }
    
    public ReadDouble() : number {
        return this.Read(8).readDoubleBE();
    }
}
