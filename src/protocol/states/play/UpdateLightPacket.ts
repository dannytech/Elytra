import { State } from "../../../Configuration";
import { Chunklet, ChunkPosition } from "../../../game/Chunklet";
import { Client } from "../../Client";
import { ClientboundPacket } from "../../Packet";
import { WritableBuffer } from "../../WritableBuffer";

export class UpdateLightPacket extends ClientboundPacket {
    private _Position: ChunkPosition;
    private _Chunklets: Chunklet[];

    constructor(client: Client, position: ChunkPosition) {
        super(client);

        this._Position = position;
    }

    private _Light(mask: number, z: number): Buffer {
        // Fixed length of the array for that chunklet (4 bits per block, 4096 values total)
        const values: Buffer = Buffer.alloc(2048);

        // Special cases for below and above the world
        switch (z) {
            case 0:
            case 17:
                values.fill(0);
                break;
            default: {
                this._Chunklets[z - 1].Blocks.reduce((prev: number, curr: number, index: number) => {
                    // Combine groups of two blocks into a single byte (4 bits per block)
                    if (index % 2 === 1) values[(index - 1)/ 2] = (prev << 4) | curr;
                    else return curr;
                });
            }
        }
        return values;
    }

    /**
     * Tell the client to update the light levels of a chunk.
     * @param {WritableBuffer} buf The outgoing packet buffer.
     * @property {number} ChunkX The X coordinate of the chunk.
     * @property {number} ChunkY The Y coordinate of the chunk.
     * @property {number} SkyLightMask The 18-bit mask of the sky light.
     * @property {number} BlockLightMask The 18-bit mask of the block light.
     * @property {number} EmptySkyLightMask The 18-bit mask of the empty sky light.
     * @property {number} EmptyBlockLightMask The 18-bit mask of the empty block light.
     * @property {number} SkyLightChunkletSize The size of the chunklet sky lighting array.
     * @property {number} SkyLightChunklet The sky lighting for a given chunklet.
     * @property {number} BlockLightChunkletSize The size of the chunklet block lighting array.
     * @property {number} BlockLightChunklet The block lighting for a given chunklet.
     * @async
     */
    public async Write(buf: WritableBuffer) {
        const world: string = this._Client.Player.State.position.world;
        this._Chunklets = await State.Worlds.get(world).GetChunklets(this._Position);

        let nonEmptyMask = 0b000000000000000000;
        for (let i = 0; i < 16; i++) {
            const blocks = this._Chunklets[i].Blocks;

            // Add non-empty chunklets to the mask
            if (blocks.some((block: number) => block > 0))
                nonEmptyMask |= (0b1 << i + 1);
        }

        // X and Y coordinates of this vertical chunk
        buf.WriteVarInt(Math.floor(this._Position.x / 16));
        buf.WriteVarInt(Math.floor(this._Position.y / 16));

        // 18-bit sky light mask (highest bit for > 256, lowest bit for < 0)
        const skyLightMask = 0b111111111111111111;
        buf.WriteVarInt(skyLightMask);

        // 18-bit block light mask (highest bit for > 256, lowest bit for < 0)
        const blockLightMask = nonEmptyMask;
        buf.WriteVarInt(blockLightMask);

        // 18-bit empty sky light mask (for all chunks which are visible to the sky)
        buf.WriteVarInt(~skyLightMask & (Math.pow(2, 18) - 1));

        // 18-bit empty block light mask (for all chunks which have no light on the blocks
        buf.WriteVarInt(~blockLightMask & (Math.pow(2, 18) - 1));

        for (let i = 0; i < 18; i++) {
            if ((skyLightMask >> i) & 0b1) {
                // Sky light values for each vertical chunklet in the mask (from under the world to above the world)
                const lighting: Buffer = this._Light(skyLightMask, i);

                buf.WriteVarInt(lighting.length);
                buf.Write(lighting);
            }
        }

        for (let i = 0; i < 18; i++) {
            if ((blockLightMask >> i) & 0b1) {
                // Sky light values for each vertical chunklet in the mask (from under the world to above the world)
                const lighting: Buffer = this._Light(blockLightMask, i);

                buf.WriteVarInt(lighting.length); // Fixed length of the array for that chunklet (4 bits per block, 4096 values total)
                buf.Write(lighting);
            }
        }
    }
}
