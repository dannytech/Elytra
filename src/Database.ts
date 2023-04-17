import { readdir } from "fs/promises";
import { URL } from "url";
import { r } from "rethinkdb-ts";
import { Console } from "./game/Console";
import * as path from "path";

/**
 * Common class to allow identity mapping for database entities
*/
export interface MappableModel {
    id?: string;
}

/**
 * Model mapper using the identity mapper pattern to serialize and deserialize objects
 */
export abstract class ModelMapper<T extends MappableModel, K> {
    protected _identityMap: Map<string, K>;

    constructor() {
        this._identityMap = new Map<string, K>();
    }

    abstract load(model: T, proxy?: boolean): K;
    abstract proxy(entity: K): K;
    abstract save(entity: K): T;
}

export class Database {
    /**
     * Connect the RethinkDB client to a cluster
     * @static
     * @async
     */
    public static async Connect() {
        const rethinkUri = new URL(process.env.RDB_URI);

        // The URI scheme should be rethinkdb://
        if (rethinkUri.protocol != "rethinkdb:")
            throw new Error("The RethinkDB URI is invalid");

        // Parse the path in case it's overcomplicated
        const path = rethinkUri.pathname.split("/");
        const db = path.length >= 2 ? path[1] : "elytra";

        await r.connectPool({
            host: rethinkUri.hostname,
            port: parseInt(rethinkUri.port),
            user: rethinkUri.username,
            password: rethinkUri.password,
            db: db
        });
        Console.Info("Connected to RethinkDB server", rethinkUri.href.green);

        await this._Bind();
    }

    /**
     * Bind database models to the database connection
     * @private
     * @static
     * @async
     */
    private static async _Bind() {
        // Dynamically load model binders
        const binders: string[] = await readdir(path.join(__dirname, "./database/models"));
        for (const binder of binders) {
            if (!binder.endsWith(".js"))
                continue;

            // Load the class file
            const model = await import(`./database/models/${binder}`);

            // Call the model binder function
            if ("ModelBinder" in model) {
                Console.Debug(`Binding model ${path.parse(binder).name.green}`);

                await model.ModelBinder();
            }
        }
    }
}
