import { readdir } from "fs/promises";
import { URL, fileURLToPath } from "url";
import path, { dirname } from "path";
import { r } from "rethinkdb-ts";

import { Logging } from "../game/Logging.js";

// Add dirname variable to support relative module loading
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Common class to allow identity mapping for database entities
*/
interface MappableModel {
    id?: string;
}

/**
 * Model mapper using the identity mapper pattern to serialize and deserialize objects
 */
abstract class ModelMapper<T extends MappableModel, K> {
    protected _identityMap: Map<string, K>;

    constructor() {
        this._identityMap = new Map<string, K>();
    }

    abstract load(model: T, proxy?: boolean): K;
    abstract proxy(entity: K): K;
    abstract save(entity: K): T;
}

class Database {
    public static Connected = false;

    /**
     * Connect the RethinkDB client to a cluster
     * @static
     * @async
     */
    public static async Connect() {
        if (Database.Connected)
            return;

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
        Logging.Info("Connected to RethinkDB server", rethinkUri.href.green);

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
        const binders: string[] = await readdir(path.join(__dirname, "./models"));
        for (const binder of binders) {
            if (!binder.endsWith(".js"))
                continue;

            // Load the class file
            const model = await import(`./models/${binder}`);

            // Call the model binder function
            if ("ModelBinder" in model) {
                Logging.Debug(`Binding model ${path.parse(binder).name.green}`);

                await model.ModelBinder();
            }
        }

        // Only mark as connected once models have bound
        Database.Connected = true;
    }
}

export {
    MappableModel,
    ModelMapper,
    Database
};
