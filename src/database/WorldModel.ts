import * as mongoose from "mongoose";
import { Schema, Model, Document } from "mongoose";

// TypeScript Interface for handling data going to and from the database
export interface IWorldSchema {
    seed: bigint,
    generator: string
}
export interface IWorldDocument extends IWorldSchema, Document {}

// Mongoose Schema for data validation and structuring
const WorldSchema: Schema = new Schema({
    seed: { type: Number, required: true },
    generator: {
        type: String,
        enum: [
            "default",
            "flat",
            "largeBiomes",
            "amplified",
            "customized",
            "buffet"
        ],
        required: true,
        default: "default"
    }
});
export const WorldModel: Model<IWorldDocument> = mongoose.model<IWorldDocument>("World", WorldSchema);
