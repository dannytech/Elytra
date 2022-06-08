import * as mongoose from "mongoose";
import { Schema, Model, Document } from "mongoose";

// TypeScript Interface for handling data going to and from the database
export interface IWorldSchema {
    seed: string,
    generator: string
}
export interface IWorldDocument extends IWorldSchema, Document {}

// Mongoose Schema for data validation and structuring
const WorldSchema: Schema = new Schema({
    seed: { type: String, required: true },
    generator: {
        type: String,
        seed: { type: Number },
        enum: [
            "default",
            "flat",
            "largeBiomes",
            "amplified",
            "customized",
            "buffet"
        ],
        default: "default"
    }
});
export const WorldModel: Model<IWorldDocument> = mongoose.model<IWorldDocument>("World", WorldSchema);
