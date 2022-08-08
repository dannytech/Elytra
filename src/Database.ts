import * as r from "rethinkdb";
import { Console } from "./game/Console";

export class Database {
    /**
     * Connect the RethinkDB driver to a cluster
     * @static
     * @async
     */
    public static async Connect() {
        await r.connect({
            host: process.env.RDB_HOST,
            port: parseInt(process.env.RDB_PORT),
            user: process.env.RDB_USER,
            password: process.env.RDB_PASS
        });

        Console.Info("Connected to RethinkDB backend");
    }
}
