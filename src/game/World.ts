import * as crypto from "crypto";
import { Types } from "mongoose";
import { WorldModel, IWorldDocument } from "../database/WorldModel";
import { Chunklet, ChunkletPosition, ChunkPosition } from "./Chunk";
import { Entity } from "./Entity";

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
    private _Entities: EntityArray;

    public Metadata: WorldMetadata;

    constructor(id?: string, seed?: string) {
        this._Entities = {
            entities: [],
            counter: 0
        };

        id || (id = new Types.ObjectId().toHexString());
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
     * Save the world to the database.
     * @async
     */
    public async Save() {
        // Update or insert the player data
        await WorldModel.findByIdAndUpdate(this.Metadata.id, {
            $setOnInsert: {
                seed: this.Metadata.seed,
                generator: this.Metadata.generator
            }
        }, {
            upsert: true
        });
    }

    /**
     * Load all worlds from the database.
     * @static
     * @async
     */
    public static async LoadWorlds() : Promise<World[]> {
        // Retrieve all existing world data
        const worldDocument: IWorldDocument[] = await WorldModel.find({}, [ "seed", "generator" ]);
        const worlds: World[] = [];

        for (const document of worldDocument) {
            const world: World = new World(document._id, document.seed);
            world.Metadata.generator = document.generator;

            worlds.push(world);
        }
        return worlds;
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
