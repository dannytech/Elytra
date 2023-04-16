import { r } from "rethinkdb-ts";
import { ModelMapper } from "../../Database";
import { World } from "../../game/World";
import { WorldModel } from "../models/WorldModel";

export class WorldModelMapper extends ModelMapper<WorldModel, World> {
    /**
     * Convert retrieved player documents into Player objects
     * @public
     */
    public load(model: WorldModel, proxy = false): World {
        // Attempt to retrieve from the identity map
        if (this._identityMap.has(model.id))
            return this._identityMap.get(model.id);

        // Otherwise, import the entity
        const newWorld = new World(model.id, model.seed);
        newWorld.Metadata.generator = model.generator;

        // Save the entity to the identity map
        this._identityMap.set(model.id, newWorld);

        return proxy ? this.proxy(newWorld) : newWorld;
    }

    public proxy(world: World): World {
        // Construct an object proxy to save mapped values to the database
        return new Proxy(world, {
            set(target, property: keyof World, value) {
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
    public save(world: World): WorldModel {
        return {
            id: world.Metadata.id,
            generator: world.Metadata.generator,
            seed: world.Metadata.seed
        };
    }
}
