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
    public Health: number;
    public Hunger: number;
    public Saturation: number;
    public XP: number;

    constructor(username: string, uuid?: UUID) {
        this.Username = username;
        if (uuid) this.UUID = uuid;

        // Defaults
        this.Gamemode = Gamemode.Survival;
        this.Health = 20;
        this.Hunger = 20;
        this.Saturation = 0;
        this.XP = 0;
    }

    public async Save() {
        // The Player object is used a placeholder during the encryption process, in which case we shouldn't save it
        if (this.UUID) {
            // Update or insert the player data
            await PlayerModel.findOneAndUpdate({
                uuid: this.UUID.Format()
            }, {
                $set: {
                    gamemode: this.Gamemode,
                    health: this.Health,
                    hunger: this.Hunger,
                    saturation: this.Saturation,
                    xp: this.XP,
                    inventory: [],
                    position: {
                        x: 0,
                        y: 0,
                        z: 0
                    },
                    rotation: {
                        horizontal: 0,
                        vertical: 0
                    }
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
        }, [ "gamemode", "health", "hunger", "saturation", "xp" ]);

        if (playerDocument) {
            // Import the player data into a new Player object
            const player: Player = new Player(username, uuid);
            player.Gamemode = playerDocument.gamemode;
            player.Health = playerDocument.health;
            player.Hunger = playerDocument.hunger;
            player.Saturation = playerDocument.saturation;
            player.XP = playerDocument.xp;

            return player;
        } else return new Player(username, uuid);
    }
}
