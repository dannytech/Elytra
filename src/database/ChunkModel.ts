import * as mongoose from "mongoose";
import { Schema, Model, Document } from "mongoose";

// TypeScript Interface for handling data going to and from the database
export interface IChunkletSchema {
    x: number,
    y: number,
    z: number,
    world: string,
    blocks: Uint16Array // at 2 bytes each, a total of 8KB
}
export interface IChunkletDocument extends IChunkletSchema, Document {}

// Mongoose Schema for data validation and structuring
const ChunkletSchema: Schema = new Schema({
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
    world: { type: Schema.Types.ObjectId, ref: "World" },
    blocks: { type: [Number], required: true }
});
ChunkletSchema.index({ x: 1, y: 1, z: 1, world: 1 }, { unique: true });
export const ChunkModel: Model<IChunkletDocument> = mongoose.model<IChunkletDocument>("Chunklet", ChunkletSchema);
