import * as crypto from "crypto";
import { WorldModel, IWorldDocument } from "../database/WorldModel";
import { Entity } from "./Entity";

type EntityArray = {
    entities: Entity[];
    counter: number;
};

type WorldMetadata = {
    seed: bigint;
    generator: string;
};

export class World {
    private _Entities: EntityArray;

    public Metadata: WorldMetadata;

    constructor(seed: bigint) {
        this._Entities = {
            entities: [],
            counter: 0
        };

        this.Metadata = {
            seed,
            generator: "default"
        };
    }

    /**
     * Keep track of the given entity as part of the world.
     * @param {Entity} entity The entity to register.
     * @returns {number} The unique entity ID within the world.
     */
    public RegisterEntity(entity: Entity) : number {
        this._Entities.entities.push(entity);

        return this._Entities.counter++;
    }

    /**
     * Save the world to the database.
     * @async
     */
    public async Save() {
        // Update or insert the player data
        await WorldModel.findOneAndUpdate({}, {
            $setOnInsert: {
                seed: this.Metadata.seed,
                generator: this.Metadata.generator
            }
        }, {
            upsert: true
        });
    }

    /**
     * Load the world from the database.
     * @static
     * @async
     */
    public static async Load() : Promise<World> {
        // Retrieve all existing player data
        const worldDocument: IWorldDocument = await WorldModel.findOne({}, [ "seed", "generator" ]);

        if (worldDocument) {
            // Import the player data into a new Player object
            const world: World = new World(worldDocument.seed);
            world.Metadata.generator = worldDocument.generator;

            return world;
        } else {
            // Generate a random seed to use for the world generator
            const seed: bigint = crypto.randomBytes(8).readBigInt64BE();
            return new World(seed);
        }
    }
}
