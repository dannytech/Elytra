import { State } from "../Configuration";

export type EntityPosition = {
    x: number;
    y: number;
    z: number;
    world: string;
}

export type EntityLook = {
    yaw: number;
    pitch: number;
}

export type EntityPositionAndLook = EntityPosition & EntityLook;

export type EntityState = {
    position: EntityPositionAndLook;
}

export class Entity {
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
