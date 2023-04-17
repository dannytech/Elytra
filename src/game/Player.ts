import { State } from "../Configuration";
import { PlayerModelMapper } from "../database/mappers/PlayerModelMapper";
import { ChunkPosition } from "./Chunklet";
import { Entity, EntityPositionAndLook } from "./Entity";
import { UUID } from "./UUID";

export enum Gamemode {
    Survival = 0b000,
    Creative = 0b001,
    Adventure = 0b010,
    Spectator = 0b011,

    Hardcore = 0b100
}

export enum PermissionLevel {
    None = 0,
    Bypass = 1,
    Cheats = 2,
    Multiplayer = 3,
    Admin = 4
}

export type PlayerProperty = {
    name: string;
    value: string;
    signature: string;
}

export type PlayerState = {
    gamemode: Gamemode;
    op: PermissionLevel;
    position: EntityPositionAndLook;
    activeChunks: ChunkPosition[];
};

export type PlayerMetadata = {
    username: string;
    uuid?: UUID;
    properties: PlayerProperty[];
};

export class Player extends Entity {
    public static Mapper: PlayerModelMapper = new PlayerModelMapper();

    public State: PlayerState;
    public Metadata: PlayerMetadata;

    constructor(username: string, uuid?: UUID) {
        const position: EntityPositionAndLook = {
            x: 0,
            y: 0,
            z: 0,
            world: State.Worlds.values().next().value.Metadata.id,
            yaw: 0,
            pitch: 0
        };
        super(position);

        this.State = {
            gamemode: Gamemode.Survival,
            op: PermissionLevel.None,
            position,
            activeChunks: []
        };
        this.Metadata = {
            username: username,
            uuid: uuid,
            properties: []
        };
    }
}
