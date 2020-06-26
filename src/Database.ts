import * as mongoose from "mongoose";
import { Connection } from "mongoose";

export class Database {
    private _Connection: Connection;

    constructor(conn: Connection) {
        this._Connection = conn;
    }

    public static async Connect(uri: string) : Promise<Database> {
        const conn: Connection = mongoose.createConnection(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        return new Database(conn);
    }
}
