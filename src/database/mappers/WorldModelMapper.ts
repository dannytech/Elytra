import { r } from "rethinkdb-ts";
import { ModelMapper } from "../../Database";
import { World } from "../../game/World";
import { WorldModel } from "../models/WorldModel";

export class WorldModelMapper extends ModelMapper<WorldModel, World> {
    /**
     * Convert retrieved world documents into World objects
     * @param {WorldModel} model The world document to convert
     * @param {boolean} proxy Whether to proxy the world object or not
     * @returns {World} A world object
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

    /**
     * Proxy World objects for write operations
     * @param {World} world The world object to create a proxy on
     * @returns {World} A proxied world object
     * @public
     */
    public proxy(world: World): World {
        // Construct an object proxy to save mapped values to the database
        return new Proxy(world, {
            set: (target, property: keyof World, value) => {
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
     * Convert World objects into serializable documents
     * @param {World} world The world object to convert
     * @returns {WorldModel} A serializable world document
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
