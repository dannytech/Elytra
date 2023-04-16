import { r, RDatum } from "rethinkdb-ts";
import { EntityPositionAndLook } from "../../game/Entity";
import { PermissionLevel } from "../../game/Player";

// TypeScript Interface for handling data going to and from the database
export interface PlayerModel {
    id: string,
    username: string,
    gamemode: number,
    op: PermissionLevel,
    positionAndLook: EntityPositionAndLook
}

export async function PlayerModelBinder() {
    await r.branch(
        r.tableList().contains("player"),
        null,
        [
            // Create player table
            r.tableCreate("player"),

            // Create secondary index for player username
            r.table("player")
                .indexCreate("username", (row: RDatum) => [
                    row("username")
                ])
        ]
    ).run();
}
