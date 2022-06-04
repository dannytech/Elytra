import { ReadableBuffer } from "./ReadableBuffer";
import { WritableBuffer } from "./WritableBuffer";
import { deflate, inflate } from "zlib";

export class Zlib {
    private static _Zlib: Buffer = Buffer.from([ 0x78, 0x01 ]);

    /**
     * Compresses data using the Deflate algorithm, and prepends the Zlib header and an Adler32 checksum.
     * @param {ReadableBuffer} uncompressed The buffer to compress.
     * @returns {ReadableBuffer} The compressed buffer, including header and checksum.
     * @static
     * @async
     */
    public static async Deflate(uncompressed: ReadableBuffer) : Promise<ReadableBuffer> {
        const output: WritableBuffer = new WritableBuffer();

        const compressed: Buffer = await new Promise((resolve, reject) => {
            deflate(uncompressed.Buffer, (err, buf: Buffer) => {
                if (err) return reject(err);

                return resolve(buf);
            });
        });

        // Write the Zlib header
        output.Write(this._Zlib);

        // Write the Adler32 checksum
        output.WriteUint32(this.Adler32(uncompressed.Buffer));

        // Write the compressed data
        output.Write(compressed);

        return output.GetReadable();
    }

    /**
     * Decompresses data using the Deflate algorithm, verifying integrity by validating the Zlib header and Adler32 checksum.
     * @param {ReadableBuffer} compressed The buffer to decompress, including Zlib header and Adler32 checksum.
     * @returns {ReadableBuffer} The decompressed buffer.
     * @throws If the checksum verification fails, an error will be thrown.
     * @throws If the Zlib header is missing, an error will be thrown.
     * @static
     * @async
     */
    public static async Inflate(compressed: ReadableBuffer) : Promise<ReadableBuffer> {
        // Verify the header is valid
        if (compressed.Read(this._Zlib.length).equals(this._Zlib)) {
            // Extract the checksum
            const checksum = compressed.ReadUint32();

            const decompressed: Buffer = await new Promise((resolve, reject) => {
                inflate(compressed.Read(), (err, buf: Buffer) => {
                    if (err) return reject(err);

                    return resolve(buf);
                });
            });

            // Verify the Adler32 checksum
            if (this.Adler32(decompressed) !== checksum)
                throw new Error("Checksum verification failed");

            return new ReadableBuffer(decompressed);
        } else
            throw new Error("Missing Zlib header");
    }

    /**
     * Computes an Adler32 checksum for the given uncompressed buffer.
     * @param {Buffer} buf The uncompressed buffer to checksum.
     * @returns {number} A 4-byte Adler32 checksum in numerical form.
     */
    public static Adler32(buf: Buffer) : number {
        const mod = 65521;
        let a = 1, b = 0;

        for (let i = 0; i < buf.length; i++)
        {
            a = (a + buf[i]) % mod;
            b = (b + a) % mod;
        }

        // 4 byte checksum
        return (b * 65536) + a;
    }
}
