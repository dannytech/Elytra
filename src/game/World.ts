import * as crypto from "crypto";
import { r } from "rethinkdb-ts";

import { WorldModelMapper } from "../database/mappers/WorldModelMapper.js";
import { ChunkletModel } from "../database/models/ChunkletModel.js";
import { Chunklet, ChunkPosition } from "./Chunklet.js";
import { Entity } from "./Entity.js";
import { UUID } from "./UUID.js";

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
     * Keep track of the given entity as part of the world
     * @param {Entity} entity The entity to register
     * @returns {number} The unique entity ID within the world
     */
    public RegisterEntity(entity: Entity): number {
        this._Entities.entities.push(entity);

        return this._Entities.counter++;
    }

    /**
     * Gets the chunklets for a given chunk position
     * @param {ChunkPosition} coords The chunk coordinates to enumerate
     * @returns {Chunklet[]} The chunklets for the given chunk position
     * @async
     */
    public async GetChunklets(coords: ChunkPosition): Promise<Chunklet[]> {
        // Attempt to load the chunklets
        const chunklets = await r.table<ChunkletModel>("chunklet")
            .getAll([
                coords.x,
                coords.y,
                this.Metadata.id
            ], { index: "chunk_position" })
            .pluck("blocks")
            .run();

        // Identify which chunklets already exist
        const existingChunklets = chunklets.map((chunklet: ChunkletModel) => chunklet.y);

        // Load or create chunklets as needed
        const newChunklets: Chunklet[] = [];
        for (let i = 0; i < 16; i++) {
            if (!existingChunklets.includes(i)) {
                // Generate a temporary chunklet
                const newChunklet = new Chunklet({
                    ...coords,
                    z: i,
                    world: this.Metadata.id
                });

                newChunklets.push(Chunklet.Mapper.proxy(newChunklet));
            }
        }

        return [
            ...chunklets
                .map<Chunklet>((chunklet: ChunkletModel) => Chunklet.Mapper.load(chunklet))
                .map<Chunklet>((chunklet: Chunklet) => Chunklet.Mapper.proxy(chunklet)),
            ...newChunklets
        ];
    }
}
