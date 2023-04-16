import { r, RDatum } from "rethinkdb-ts";

// TypeScript interface for handling data going to and from the database
export interface ConfigModel {
    namespace: string
    name: string
    value: unknown
}

export async function ConfigModelBinder() {
    await r.branch(
        r.tableList().contains("config"),
        null,
        [
            // Create config table
            r.tableCreate("config"),

            // Create secondary index for namespace/name
            r.table("config")
                .indexCreate("namespaced_config", (row: RDatum) => [
                    row("namespace"),
                    row("name")
                ])
        ]
    ).run();
}
