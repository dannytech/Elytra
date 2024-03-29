import { r, RDatum, WriteResult } from "rethinkdb-ts";

import { State } from "../State.js";
import { PlayerModelMapper } from "../database/mappers/PlayerModelMapper.js";
import { PlayerModel } from "../database/models/PlayerModel.js";
import { ChunkPosition } from "./Chunklet.js";
import { Entity, EntityPositionAndLook } from "./Entity.js";
import { Logging } from "./Logging.js";
import { UUID } from "./UUID.js";

enum Gamemode {
    Survival = 0b000,
    Creative = 0b001,
    Adventure = 0b010,
    Spectator = 0b011,

    Hardcore = 0b100
}

enum PermissionLevel {
    None = 0,
    Bypass = 1,
    Cheats = 2,
    Multiplayer = 3,
    Admin = 4
}

type PlayerProperty = {
    name: string;
    value: string;
    signature?: string;
}

type PlayerState = {
    gamemode: Gamemode;
    op: PermissionLevel;
    position: EntityPositionAndLook;
    activeChunks: ChunkPosition[];
};

type PlayerMetadata = {
    username: string;
    uuid?: UUID;
    properties: PlayerProperty[];
};

class Player extends Entity {
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

    /**
     * Save the player to the database
     */
    public Save() {
        // Export the player to a database document
        const playerDoc: PlayerModel = Player.Mapper.save(this);
        Logging.Trace("Saving player");

        // Upsert the player document
        r.table<PlayerModel>("player")
            .get(this.Metadata.uuid.Format())
            .replace(playerDoc, {
                returnChanges: true
            })
            .do((res: RDatum<WriteResult<PlayerModel>>) => res("replaced").eq(1).branch(
                res,
                r.table<PlayerModel>("player").insert(playerDoc, {
                    returnChanges: true
                })
            ))
            .run();
    }
}

export {
    Gamemode,
    PermissionLevel,
    PlayerProperty,
    PlayerState,
    PlayerMetadata,
    Player
};
