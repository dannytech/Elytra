import { r } from "rethinkdb-ts";

// TypeScript Interface for handling data going to and from the database
export interface WorldModel {
    id: string,
    seed: string,
    generator: string
}

export async function ModelBinder() {
    // Create config tables
    await r.branch(
        r.tableList().contains("world"),
        true,
        r.tableCreate("world")
    ).run();
}
