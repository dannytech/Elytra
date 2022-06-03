import * as mongoose from "mongoose";
import { Console } from "./game/Console";

export class Database {
    /**
     * Connect Mongoose to the database backend
     * @param {string} uri A MongoDB connection URI
     * @static
     * @async
     */
    public static async Connect(uri: string) {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useFindAndModify: false,
            useCreateIndex: true,
            useUnifiedTopology: true
        });

        Console.Info(`Connected to database with URI ${uri.green}`);
    }

    /**
     * Disconnect Mongoose from the database backend
     * @static
     * @async
     */
    public static async Disconnect() {
        await mongoose.disconnect();
        Console.Info("Disconnected from database");
    }
}
