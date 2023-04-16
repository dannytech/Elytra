import { ChunkletModelMapper } from "../database/mappers/ChunkletModelMapper";

// We can reuse the player position but give it a more familiar name
export type ChunkPosition = {
    x: number;
    y: number;
    world: string;
};

export type ChunkletPosition = {
    x: number;
    y: number;
    z: number;
    world: string;
};

export class Chunklet {
    public static Mapper: ChunkletModelMapper = new ChunkletModelMapper();

    public Position: ChunkletPosition;
    public Blocks: Uint16Array;

    constructor(position: ChunkletPosition, blocks?: Uint16Array) {
        this.Position = position;

        // Load or generate the blocks
        if (blocks)
            this.Blocks = blocks;
        else
            this._Generate();
    }

    private _Generate() {
        this.Blocks = new Uint16Array(4096);

        // TODO Something other than the below superflat generator
        if (this.Position.z == 0)
            this.Blocks.fill(1);
    }
}
