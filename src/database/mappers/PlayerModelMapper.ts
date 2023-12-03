import { r } from "rethinkdb-ts";

import { ModelMapper } from "../Database.js";
import { Player } from "../../game/Player.js";
import { UUID } from "../../game/UUID.js";
import { PlayerModel } from "../models/PlayerModel.js";

export class PlayerModelMapper extends ModelMapper<PlayerModel, Player> {
    /**
     * Convert retrieved player documents into Player objects
     * @param {PlayerModel} model The player document to convert
     * @param {boolean} proxy Whether to proxy the player object or not
     * @returns {Player} A player object
     * @public
     */
    public load(model: PlayerModel, proxy = false): Player {
        // Attempt to retrieve from the identity map
        if (this._identityMap.has(model.id))
            return this._identityMap.get(model.id);

        // Otherwise, import the entity
        const newPlayer = new Player(model.username, new UUID(model.id));
        newPlayer.State.gamemode = model.gamemode;
        newPlayer.State.position = model.positionAndLook;
        newPlayer.State.op = model.op;

        // Save the entity to the identity map
        this._identityMap.set(model.id, newPlayer);

        return proxy ? this.proxy(newPlayer) : newPlayer;
    }

    /**
     * Proxy Player objects for write operations
     * @param {Player} player The player object to create a proxy on
     * @returns {Player} A proxied player object
     * @public
     */
    public proxy(player: Player): Player {
        return new Proxy(player, {
            set: (target, property: keyof Player, value) => {
                target[property as keyof Player] = value;

                // Flush changes to the database
                r.table("player")
                    .insert(this.save(target), { conflict: "update" })
                    .run();

                return true;
            }
        });
    }

    /**
     * Convert Player objects into serializable documents
     * @param {Player} player The player object to convert
     * @returns {PlayerModel} A serializable player document
     * @public
     */
    public save(player: Player): PlayerModel {
        return {
            id: player.Metadata.uuid.Format(),
            gamemode: player.State.gamemode,
            op: player.State.op,
            positionAndLook: player.State.position,
            username: player.Metadata.username
        };
    }
}
