import * as mongoose from "mongoose";
import { Schema, Model, Document } from "mongoose";
import { PermissionLevel } from "../game/Player";

// TypeScript Interface for handling data going to and from the database
export interface IPlayerSchema {
    uuid: string,
    username: string[],
    gamemode: number,
    op: PermissionLevel,
    world: string
}
export interface IPlayerDocument extends IPlayerSchema, Document {}

// Mongoose Schema for data validation and structuring
const PlayerSchema: Schema = new Schema({
    uuid: { type: String, required: true, unique: true },
    username: [{ type: String, required: true }],
    gamemode: { type: Number, min: 0, max: 7, required: true },
    world: { type: mongoose.SchemaTypes.ObjectId }
});
PlayerSchema.index({ uuid: 1, username: 1 }, { unique: true });
export const PlayerModel: Model<IPlayerDocument> = mongoose.model<IPlayerDocument>("Player", PlayerSchema);
