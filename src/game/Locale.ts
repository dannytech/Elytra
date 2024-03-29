import { readFile } from "fs/promises";
import { parse } from "yaml";
import joi, { Schema } from "joi";

import { VersionSpec, versionSpec } from "../Masking.js";

interface Translation {
    versions: VersionSpec[];
    translations: Record<string, string>;
}

type TranslationMapping = Record<string, Translation>;

class Locale {
    // YAML file schema
    private static _Schema: Schema = joi.object().pattern(/^[a-zA-Z0-9.]+$/, joi.object({
        versions: joi.array().items(joi.alternatives(joi.string(), joi.number())),
        translations: joi.object().pattern(/^[a-z]{2,4}(_[A-Z]{2,4})?$/, joi.string()).min(1)
    })).min(1);

    // Translation key mapping and metadata
    public static Mapping: TranslationMapping = {};

    public static async Load() {
        // Load locale mappings
        const locales: string = await readFile("./src/game/locales.yml", "utf8");

        // Parse the locale mapping
        const mapping = parse(locales);

        // Validate them with Joi
        await this._Schema.validateAsync(mapping);

        // Parse the version specifications
        for (const key of Object.keys(mapping)) {
            const locale = mapping[key];

            // Convert the version specification strings to an object representation
            locale.versions = locale.versions.map((version: string) => versionSpec(version));
        }

        // Apply the mapping
        this.Mapping = mapping;
    }
}

export {
    Translation,
    TranslationMapping,
    Locale
};
