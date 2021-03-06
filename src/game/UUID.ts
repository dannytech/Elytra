import { v4 as uuidv4 } from "uuid";

export class UUID {
    private _UUID: string;

    constructor(uuid: string) {
        // Confirm that the UUID is valid and convert it to a normalized format
        if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(uuid))
            this._UUID = uuid.replace(/-/g, "");
        else if (/^[0-9a-f]{32}$/i.test(uuid)) this._UUID = uuid;
        else throw new Error("Invalid UUID format");
    }

    /**
     * Exports the UUID to a formatted string
     * @param {boolean} hyphenate Whether to hyphenate the UUID
     * @returns {string} The formatted UUID
     */
    public Format(hyphenate: boolean = false) : string {
        if (hyphenate) return this._UUID.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
        else return this._UUID;
    }

    /**
     * Generate a new random UUID object
     * @returns {UUID} The generated UUID object
     */
    public static Generate() : UUID {
        return new UUID(uuidv4());
    }
}