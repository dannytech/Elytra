import * as mongoose from "mongoose";
import { Schema, Model, Document } from "mongoose";

// TypeScript Interfaces for handling data going to and from the database
export interface IPlayer {
    uuid: string,
    gamemode: number,
    health: number,
    hunger: number,
    saturation: number,
    xp: number,
    inventory: Array<{
        slot: number,
        id: string,
        count: number,
        durability?: number
    }>,
    dimension: string,
    position: {
        x: number,
        y: number,
        z: number
    },
    rotation: {
        horizontal: number,
        vertical: number
    }
}
export interface IPlayerDocument extends IPlayer, Document {}

// Mongoose Schema for data validation and structuring
const PlayerSchema: Schema = new Schema({
    uuid: { type: String, required: true, index: true },
    gamemode: { type: Number, min: 0, max: 7, required: true },
    health: { type: Number, min: 0, required: true },
    hunger: { type: Number, min: 0, max: 20, required: true },
    saturation: { type: Number, min: 0, max: 20, required: true },
    xp: { type: Number, min: 0, required: true },
    inventory: [{
        slot: { type: Number, min: 0, required: true },
        id: { type: String, required: true },
        count: { type: Number, min: 1, max: 64, required: true },
        durability: { type: Number, min: 0 }
    }],
    dimension: { type: String, required: true },
    position: {
        type: new Schema({
            x: { type: Number, required: true },
            y: { type: Number, required: true },
            z: { type: Number, required: true }
        }),
        required: true
    },
    rotation: {
        type: new Schema({
            horizontal: { type: Number, required: true },
            vertical: { type: Number, required: true }
        }),
        required: true
    }
});
export const PlayerModel: Model<IPlayerDocument> = mongoose.model<IPlayerDocument>("Player", PlayerSchema);
