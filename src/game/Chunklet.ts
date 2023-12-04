import { ChunkletModelMapper } from "../database/mappers/ChunkletModelMapper.js";

// We can reuse the player position but give it a more familiar name
type ChunkPosition = {
    x: number;
    y: number;
    world: string;
};

type ChunkletPosition = {
    x: number;
    y: number;
    z: number;
    world: string;
};

class Chunklet {
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

export {
    ChunkPosition,
    ChunkletPosition,
    Chunklet
};
