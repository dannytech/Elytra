import { r } from "rethinkdb-ts";
import { ModelMapper } from "../../Database";
import { Chunklet, ChunkletPosition } from "../../game/Chunklet";
import { ChunkletModel } from "../models/ChunkletModel";

export class ChunkletModelMapper extends ModelMapper<ChunkletModel, Chunklet> {
    // Maps coordinates to an internal ID
    private coords: Map<ChunkletPosition, string>;

    constructor() {
        super();

        this.coords = new Map();
    }

    /**
     * Convert retrieved player documents into Player objects
     * @public
     */
    public load(model: ChunkletModel, proxy = false): Chunklet {
        // Attempt to retrieve from the identity map
        if (this._identityMap.has(model.id))
            return this._identityMap.get(model.id);

        // Otherwise, import the entity
        const newChunklet = new Chunklet({
            x: model.x,
            y: model.y,
            z: model.z,
            world: model.world
        }, model.blocks);

        // Save the coordinates to the ID map
        this.coords.set(newChunklet.Position, model.id);

        // Save the entity to the identity map
        this._identityMap.set(model.id, newChunklet);

        return proxy ? this.proxy(newChunklet) : newChunklet;
    }

    public proxy(chunklet: Chunklet): Chunklet {
        // Construct an object proxy to save mapped values to the database
        return new Proxy(chunklet, {
            set(target, property: keyof Chunklet, value) {
                const prop: PropertyDescriptor = Object.getOwnPropertyDescriptor.call(target, property);
                if (prop && prop.writable)
                    target[property] = value;

                // Flush changes to the database
                r.table("world")
                    .insert(this.save(target), { conflict: "update" })
                    .run();

                return true;
            }
        });
    }

    /**
     * Convert Player objects into serializable documents
     * @public
     */
    public save(chunklet: Chunklet): ChunkletModel {
        // Attempts to map to an existing chunk
        const id = this.coords.get(chunklet.Position);

        return {
            id,
            ...chunklet.Position,
            blocks: chunklet.Blocks
        };
    }
}
