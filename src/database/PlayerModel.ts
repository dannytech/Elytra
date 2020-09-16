import * as mongoose from "mongoose";
import { Schema, Model, Document } from "mongoose";

// TypeScript Interface for handling data going to and from the database
export interface IPlayerSchema {
    uuid: string,
    gamemode: number
}
export interface IPlayerDocument extends IPlayerSchema, Document {}

// Mongoose Schema for data validation and structuring
const PlayerSchema: Schema = new Schema({
    uuid: { type: String, required: true, index: true, unique: true },
    gamemode: { type: Number, min: 0, max: 7, required: true },
    world: { type: mongoose.SchemaTypes.ObjectId }
});
export const PlayerModel: Model<IPlayerDocument> = mongoose.model<IPlayerDocument>("Player", PlayerSchema);
