import { PlayerModel, IPlayerDocument } from "../database/PlayerModel";
import { UUID } from "./UUID";

export enum Gamemode {
    Survival = 0b000,
    Creative = 0b001,
    Adventure = 0b010,
    Spectator = 0b011,

    Hardcore = 0b100
}

export class Player {
    public Username: string;
    public UUID: UUID;
    public Gamemode: number;

    constructor(username: string, uuid?: UUID) {
        this.Username = username;
        if (uuid) this.UUID = uuid;

        // Defaults
        this.Gamemode = Gamemode.Survival;
    }

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
