import { ReadableBuffer } from "./ReadableBuffer";
import { WritableBuffer } from "./WritableBuffer";
import { deflate, inflate } from "zlib";

export class Zlib {
    private static _Zlib: Buffer = Buffer.from([ 0x78, 0x01 ]);

    public static async Deflate(uncompressed: ReadableBuffer) : Promise<ReadableBuffer> {
        let output = new WritableBuffer();
        
        const compressed: Buffer = await new Promise((resolve, reject) => {
            deflate(uncompressed.Buffer, (err, buf: Buffer) => {
                if (err) return reject(err);
                
                return resolve(buf);
            })
        });

        // Write the Zlib header
        output.Write(this._Zlib);

        // Write the Adler32 checksum
        output.WriteUint32(this.Adler32(uncompressed.Buffer));

        // Write the compressed data
        output.Write(compressed);

        return output.GetReadable();
    }

    public static async Inflate(compressed: ReadableBuffer) : Promise<ReadableBuffer> {
        let output = new WritableBuffer();
        
        // Verify the header is valid
        if (compressed.Read(2) === this._Zlib) {
            // Extract the checksum
            const checksum = compressed.ReadUint32();

            const decompressed: Buffer = await new Promise((resolve, reject) => {
                inflate(compressed.Read(), (err, buf: Buffer) => {
                    if (err) return reject(err);
                    
                    return resolve(buf);
                })
            });

            // Verify the Adler32 checksum
            if (this.Adler32(decompressed) !== checksum)
                throw new Error("Checksum verification failed");

            return new ReadableBuffer(decompressed);
        } else
            throw new Error("Missing Zlib header");
    }

    public static Adler32(buf: Buffer) : number {
        const mod: number = 65521;
        let a: number = 1, b: number = 0;

        for (let i = 0; i < buf.length; i++)
        {
            a = (a + buf[i]) % mod;
            b = (b + a) % mod;
        }

        // 4 byte checksum
        return (b * 65536) + a;
    }
}