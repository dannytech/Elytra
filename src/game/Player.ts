import { UUID } from "./UUID";

enum Gamemode {
    Survival = 0b000,
    Creative = 0b001,
    Adventure = 0b010,

    Hardcore = 0b100
}

export class Player {
    public Username: string;
    public UUID: UUID;
    public Gamemode: number;

    constructor(username: string, uuid?: UUID) {
        this.Username = username;
        if (uuid) this.UUID = uuid;
    }
}