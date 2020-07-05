import { State } from "../Configuration";

export class Entity {
    public EntityID: number;

    constructor() {
        // Register the entity as part of the world
        this.EntityID = State.World.RegisterEntity(this);
    }
}
