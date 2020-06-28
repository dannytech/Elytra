import * as mongoose from "mongoose";

export class Database {
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
