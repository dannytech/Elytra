import * as mongoose from "mongoose";

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

        console.log(`Connected to database with URI ${uri}`);
    }
}
