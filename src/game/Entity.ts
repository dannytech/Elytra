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

export class Entity {
    public EntityID: number;

    constructor(position: EntityPosition) {
        // Register the entity as part of the world
        this.EntityID = State.Worlds[position.world].RegisterEntity(this);
    }
}
