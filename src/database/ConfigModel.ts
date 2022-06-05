import * as mongoose from "mongoose";
import { Schema, Model, Document } from "mongoose";

// TypeScript Interface for handling data going to and from the database
export interface IConfigSchema {
    namespace: string
    name: string
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    value: any
}
export interface IConfigDocument extends IConfigSchema, Document {}

// Mongoose Schema for data validation and structuring
const ConfigSchema: Schema = new Schema({
    namespace: { type: String, required: true },
    name: { type: String, required: true },
    value: { type: mongoose.SchemaTypes.Mixed, required: true }
});
ConfigSchema.index({ name: 1, namespace: 1}, { unique: true });
export const ConfigModel: Model<IConfigDocument> = mongoose.model<IConfigDocument>("Config", ConfigSchema);
