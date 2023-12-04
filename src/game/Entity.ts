import { State } from "../State.js";

type EntityPosition = {
    x: number;
    y: number;
    z: number;
    world: string;
}

type EntityLook = {
    yaw: number;
    pitch: number;
}

type EntityPositionAndLook = EntityPosition & EntityLook;

type EntityState = {
    position: EntityPositionAndLook;
}

class Entity {
    public EntityID: number;
    public State: EntityState;

    constructor(position: EntityPositionAndLook) {
        // Register the entity as part of the world
        this.State = {
            position
        };

        this.EntityID = State.Worlds.get(position.world).RegisterEntity(this);
    }
}

export {
    EntityPosition,
    EntityLook,
    EntityPositionAndLook,
    EntityState,
    Entity
};
