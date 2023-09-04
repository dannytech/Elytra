import { ReadableBuffer } from "./ReadableBuffer";
import { WritableBuffer } from "./WritableBuffer";
import { deflate, inflate } from "zlib";

export class Zlib {
    /**
     * Compresses data using the Deflate algorithm, and prepends the Zlib header and an Adler32 checksum
     * @param {ReadableBuffer} uncompressed The buffer to compress
     * @returns {ReadableBuffer} The compressed buffer, including header and checksum
     * @static
     * @async
     */
    public static async Deflate(uncompressed: ReadableBuffer): Promise<ReadableBuffer> {
        const output: WritableBuffer = new WritableBuffer();

        const compressed: Buffer = await new Promise((resolve, reject) => {
            deflate(uncompressed.Buffer, (err, buf: Buffer) => {
                if (err) return reject(err);

                return resolve(buf);
            });
        });

        // Write the compressed data
        output.Write(compressed, "Compressed Data");

        return output.ReadableBuffer;
    }

    /**
     * Decompresses data using the Deflate algorithm, verifying integrity by validating the Zlib header and Adler32 checksum
     * @param {ReadableBuffer} compressed The buffer to decompress, including Zlib header and Adler32 checksum
     * @returns {ReadableBuffer} The decompressed buffer
     * @static
     * @async
     */
    public static async Inflate(compressed: ReadableBuffer): Promise<ReadableBuffer> {
        const decompressed: Buffer = await new Promise((resolve, reject) => {
            inflate(compressed.Read("Compressed Data"), (err, buf: Buffer) => {
                if (err) return reject(err);

                return resolve(buf);
            });
        });

        return new ReadableBuffer(decompressed);
    }
}
