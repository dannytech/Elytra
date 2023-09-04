import { deflate, inflate } from "zlib";

export class Zlib {
    /**
     * Compresses data using the Deflate algorithm
     * @param {Buffer} uncompressed The buffer to compress
     * @returns {Buffer} The compressed buffer
     * @static
     * @async
     */
    public static async Deflate(uncompressed: Buffer): Promise<Buffer> {
        const compressed: Buffer = await new Promise((resolve, reject) => {
            deflate(uncompressed, (err, buf: Buffer) => {
                if (err) return reject(err);

                return resolve(buf);
            });
        });

        return compressed;
    }

    /**
     * Decompresses data using the Deflate algorithm
     * @param {Buffer} compressed The buffer to decompress
     * @returns {Buffer} The decompressed buffer
     * @static
     * @async
     */
    public static async Inflate(compressed: Buffer): Promise<Buffer> {
        const decompressed: Buffer = await new Promise((resolve, reject) => {
            inflate(compressed, (err, buf: Buffer) => {
                if (err) return reject(err);

                return resolve(buf);
            });
        });

        return decompressed;
    }
}
