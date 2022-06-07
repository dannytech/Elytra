import { IPlayerDocument, PlayerModel } from "../database/PlayerModel";
import { Entity } from "./Entity";
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

export type PlayerPosition = {
    x: number;
    y: number;
    z: number;
}

export type PlayerLook = {
    yaw: number;
    pitch: number;
}

export type PlayerPositionAndLook = PlayerPosition & PlayerLook;

export type PlayerState = {
    gamemode: Gamemode;
    op: PermissionLevel;
    position: PlayerPositionAndLook;
    activeChunks: number;
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
        super();

        this.State = {
            gamemode: Gamemode.Survival,
            op: PermissionLevel.None,
            position: {
                x: 0,
                y: 0,
                z: 0,
                yaw: 0,
                pitch: 0
            },
            activeChunks: 0
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
