import { r, RDatum } from "rethinkdb-ts";

// TypeScript Interface for handling data going to and from the database
export interface ChunkletModel {
    id?: string,
    x: number,
    y: number,
    z: number,
    world: string,
    blocks: Uint16Array // at 2 bytes each, a total of 8KB
}

export async function ChunkletModelBinder() {
    await r.branch(
        r.tableList().contains("chunklet"),
        null,
        [
            // Create chunklet table
            r.tableCreate("chunklet"),

            // Create secondary indices for Chunk/Chunklet positions
            r.table("chunklet")
                .indexCreate("chunk_position", (row: RDatum) => [
                    row("x"),
                    row("y"),
                    row("world")
                ]),
            r.table("chunklet")
                .indexCreate("chunklet_position", (row: RDatum) => [
                    row("x"),
                    row("y"),
                    row("z"),
                    row("world")
                ])
        ]
    ).run();
}
