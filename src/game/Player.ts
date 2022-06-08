import { State } from "../Configuration";
import { IPlayerDocument, PlayerModel } from "../database/PlayerModel";
import { ChunkPosition } from "./Chunk";
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
    public State: PlayerState;
    public Metadata: PlayerMetadata;

    constructor(username: string, uuid?: UUID) {
        const position: EntityPositionAndLook = {
            x: 0,
            y: 0,
            z: 0,
            world: Object.values(State.Worlds)[0].Metadata.id,
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
     * Save the player object to the database.
     * @async
     */
    public async Save() {
        // The Player object is used a placeholder during the encryption process, in which case we shouldn't save it
        if (this.Metadata.uuid) {
            // Update or insert the player data
            await PlayerModel.findOneAndUpdate({
                uuid: this.Metadata.uuid.Format()
            }, {
                $setOnInsert: {
                    uuid: this.Metadata.uuid.Format()
                },
                $set: {
                    gamemode: this.State.gamemode,
                    op: this.State.op,
                    positionAndLook: this.State.position
                }
            }, {
                upsert: true
            });
        }
    }

    /**
     * Load a player object from the database.
     * @async
     */
    public async Load() {
        // Retrieve state and update the username history
        const playerDocument: IPlayerDocument = await PlayerModel.findOneAndUpdate({
            uuid: this.Metadata.uuid.Format()
        }, {
            $addToSet: {
                username: this.Metadata.username
            }
        }, { new: true });

        if (playerDocument) {
            // Load the player state
            this.State.gamemode = playerDocument.gamemode;
            this.State.op = playerDocument.op;
            this.State.position = playerDocument.positionAndLook;
        }
    }
}
