import * as mongoose from "mongoose";
import { Schema, Model, Document } from "mongoose";
import { PermissionLevel, PlayerPositionAndLook } from "../game/Player";

// TypeScript Interface for handling data going to and from the database
export interface IPlayerSchema {
    uuid: string,
    username: string[],
    gamemode: number,
    op: PermissionLevel,
    world: string,
    positionAndLook: PlayerPositionAndLook
}
export interface IPlayerDocument extends IPlayerSchema, Document {}

// Mongoose subdocument schema for position and look
const PlayerPositionAndLookSchema = new Schema({
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 },
    yaw: { type: Number, default: 0 },
    pitch: { type: Number, default: 0 }
});

// Mongoose Schema for data validation and structuring
const PlayerSchema: Schema = new Schema({
    uuid: { type: String, required: true, unique: true },
    username: [{ type: String, required: true }],
    gamemode: { type: Number, min: 0, max: 7, required: true },
    op: { type: Number, min: 0, max: 4 },
    world: { type: mongoose.SchemaTypes.ObjectId },
    positionAndLook: { type: PlayerPositionAndLookSchema, required: true }
});
PlayerSchema.index({ uuid: 1, username: 1 }, { unique: true });
export const PlayerModel: Model<IPlayerDocument> = mongoose.model<IPlayerDocument>("Player", PlayerSchema);
