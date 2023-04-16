import * as crypto from "crypto";
import { r } from "rethinkdb-ts";
import { WorldModelMapper } from "../database/mappers/WorldModelMapper";
import { ChunkletModel } from "../database/models/ChunkletModel";
import { Chunklet, ChunkPosition } from "./Chunklet";
import { Entity } from "./Entity";
import { UUID } from "./UUID";

type EntityArray = {
    entities: Entity[];
    counter: number;
};

type WorldMetadata = {
    id: string,
    seed?: string;
    generator: string;
};

export class World {
    public static Mapper: WorldModelMapper = new WorldModelMapper();

    private _Entities: EntityArray;

    public Metadata: WorldMetadata;

    constructor(id?: string, seed?: string) {
        this._Entities = {
            entities: [],
            counter: 0
        };

        id || (id = UUID.Generate().Format(true));
        this.Metadata = {
            id,
            generator: "default"
        };

        // Generate a random world seed
        seed || (this.Metadata.seed = crypto.randomBytes(8).toString("hex"));
    }

    /**
     * Keep track of the given entity as part of the world.
     * @param {Entity} entity The entity to register.
     * @returns {number} The unique entity ID within the world.
     */
    public RegisterEntity(entity: Entity): number {
        this._Entities.entities.push(entity);

        return this._Entities.counter++;
    }

    /**
     * Gets the chunklets for a given chunk position.
     * @param {ChunkPosition} coords The chunk coordinates to enumerate.
     * @returns {Chunklet[]} The chunklets for the given chunk position.
     * @async
     */
    public async GetChunklets(coords: ChunkPosition): Promise<Chunklet[]> {
        const chunks: Chunklet[] = [];

        // Loads the entire column of chunklets
        for (let i = 0; i < 16; i++) {
            chunks.push(new Chunklet({
                ...coords,
                z: i,
                world: this.Metadata.id
            }));
        }

        // Load all the chunklets asynchronously
        const loaders: Promise<boolean>[] = chunks.map(async (chunk: Chunklet) => await chunk.Load());
        await Promise.all(loaders);

        return chunks;
    }
}
