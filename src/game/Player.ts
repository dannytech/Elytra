import { PlayerModel, IPlayerDocument } from "../database/PlayerModel";
import { Entity } from "./Entity";
import { UUID } from "./UUID";

export enum Gamemode {
    Survival = 0b000,
    Creative = 0b001,
    Adventure = 0b010,
    Spectator = 0b011,

    Hardcore = 0b100
}

export class Player extends Entity {
    public Username: string;
    public UUID: UUID;
    public Gamemode: number;

    constructor(username: string, uuid?: UUID) {
        super();

        this.Username = username;
        if (uuid) this.UUID = uuid;

        // Defaults
        this.Gamemode = Gamemode.Survival;
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
                $set: {
                    gamemode: this.Gamemode
                }
            }, {
                upsert: true
            });
        }
    }

    /**
     * Load a player object from the database.
     * @param {string} username The username of the player (not used in database queries).
     * @param {string} uuid The UUID of the player, used in the query.
     * @static
     * @async
     */
    public static async Load(username: string, uuid: UUID) : Promise<Player> {
        // Retrieve all existing player data
        const playerDocument: IPlayerDocument = await PlayerModel.findOne({
            uuid: uuid.Format()
        }, [ "gamemode" ]);

        if (playerDocument) {
            // Import the player data into a new Player object
            const player: Player = new Player(username, uuid);
            player.Gamemode = playerDocument.gamemode;

            return player;
        } else return new Player(username, uuid);
    }
}
