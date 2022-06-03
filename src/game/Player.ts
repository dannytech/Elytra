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

export interface PlayerPosition {
    x: number;
    y: number;
    z: number;
}

export interface PlayerLook {
    yaw: number;
    pitch: number;
}

export type PlayerPositionAndLook = PlayerPosition & PlayerLook;

export class Player extends Entity {
    public Username: string;
    public UUID: UUID;
    public Gamemode: number;
    public Op: PermissionLevel;
    public Position: PlayerPositionAndLook;

    constructor(username: string, uuid?: UUID) {
        super();

        this.Username = username;
        if (uuid) this.UUID = uuid;

        // Defaults
        this.Gamemode = Gamemode.Survival;
        this.Op = PermissionLevel.None;
        this.Position = {
            x: 0,
            y: 0,
            z: 0,
            yaw: 0,
            pitch: 0
        };
    }

    /**
     * Save the player object to the database.
     * @async
     */
    public async Save() {
        // The Player object is used a placeholder during the encryption process, in which case we shouldn't save it
        if (this.UUID) {
            // Update or insert the player data
            await PlayerModel.findOneAndUpdate({
                uuid: this.UUID.Format()
            }, {
                $setOnInsert: {
                    uuid: this.UUID.Format()
                },
                $set: {
                    gamemode: this.Gamemode,
                    op: this.Op,
                    positionAndLook: this.Position
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
            uuid: this.UUID.Format()
        }, {
            $addToSet: {
                username: this.Username
            }
        }, { new: true });

        if (playerDocument) {
            // Load the player state
            this.Gamemode = playerDocument.gamemode;
            this.Op = playerDocument.op;
            this.Position = playerDocument.positionAndLook;
        }
    }
}
