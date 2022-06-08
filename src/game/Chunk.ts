import { ChunkModel, IChunkletDocument } from "../database/ChunkModel";

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
    private _Blocks: Uint16Array;

    public Position: ChunkletPosition;

    public get Blocks(): Uint16Array {
        return this._Blocks;
    }
    public get BlockCount(): number {
        return this._Blocks.filter((block: number) => block > 0).length;
    }

    constructor(position: ChunkletPosition) {
        this.Position = position;
    }

    private _Generate() {
        this._Blocks = new Uint16Array(4096);

        // TODO Something other than the below superflat generator
        if (this.Position.z == 0)
            this._Blocks.fill(1);
    }

    /**
     * Attempts to load the chunk from the database
     */
    public async Load(): Promise<boolean> {
        const chunk: IChunkletDocument = await ChunkModel.findOne({
            x: this.Position.x,
            y: this.Position.y,
            z: this.Position.z,
            world: this.Position.world
        }, [ "blocks" ]);

        // If the database contained this chunk, load it, otherwise, generate it
        if (chunk)
            this._Blocks = chunk.blocks;
        else this._Generate();

        return chunk != null;
    }
}
