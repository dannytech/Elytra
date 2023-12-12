import { Resolver, Query, Arg, Mutation, registerEnumType, ObjectType, createUnionType, Field } from "type-graphql";
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import { FileUpload } from "graphql-upload/Upload.mjs";
import { GraphQLJSON } from "graphql-type-json";
import joi from "joi";

import { Settings } from "./Configuration.js";
import { Constants } from "./Constants.js";
import { Logging } from "./game/Logging.js";
import { BinaryData } from "./API.js";

enum AddRemoveOptions {
    Add = "add",
    Remove = "remove"
}
registerEnumType(AddRemoveOptions, {
    name: "AddRemoveOptions"
});

@ObjectType()
abstract class SettingBase {
    @Field() namespace: string;
    @Field() name: string;
}

@ObjectType()
class StringSetting extends SettingBase {
    @Field() value: string;
}

@ObjectType()
class NumberSetting extends SettingBase {
    @Field() value: number;
}

@ObjectType()
class BooleanSetting extends SettingBase {
    @Field() value: boolean;
}

@ObjectType()
class BinarySetting extends SettingBase {
    @Field(() => BinaryData) value: typeof BinaryData;
}

@ObjectType()
class JSONSetting extends SettingBase {
    @Field(() => GraphQLJSON) value: typeof GraphQLJSON;
}

const SettingUnion = createUnionType({
    name: "Setting",
    types: () => [StringSetting, NumberSetting, BooleanSetting, BinarySetting, JSONSetting] as const,
    resolveType: setting => {
        switch (typeof setting.value) {
            case "string":
                return StringSetting;
            case "number":
            case "bigint":
                return NumberSetting;
            case "boolean":
                return BooleanSetting;
            case "object": {
                const binarySchema = joi.object({
                    encoding: joi.string().valid("base64", "hex"),
                    data: joi.alternatives(joi.string().base64(), joi.string().hex())
                });

                // Test the data against the binary schema
                if (setting.value != null) {
                    const test = binarySchema.validate(setting.value, { presence: "required" });

                    if (!test.error)
                        return BinarySetting;
                }

                return JSONSetting;
            }
        }
    },
});

/**
 * GraphQL stub resolver for runtime settings
 */
@Resolver()
export class SettingsResolver {
    @Query(() => SettingUnion)
    setting(
        @Arg("namespace", { defaultValue: Constants.ConfigNamespace }) namespace: string,
        @Arg("name") name: string
    ): typeof SettingUnion {
        let value = Settings.Get(namespace, name);

        // Passthrough or convert the value to a GraphQL-compatible type
        switch (typeof value) {
            case "string":
            case "number":
            case "bigint":
            case "boolean":
                break;
            case "object":
                if (Buffer.isBuffer(value))
                    value = {
                        encoding: "base64",
                        data: value.toString("base64")
                    } as BinaryData;
                else break;
        }

        // Attach metadata about the queried value
        return {
            namespace,
            name,
            value
        } as typeof SettingUnion;
    }

    @Mutation(() => String, { nullable: true })
    setSettingString(
        @Arg("namespace", { defaultValue: Constants.ConfigNamespace }) namespace: string,
        @Arg("name") name: string,
        @Arg("value", () => String) value: string
    ): string {
        return Settings.Set(namespace, name, value);
    }

    @Mutation(() => String, { nullable: true })
    setSettingNumber(
        @Arg("namespace", { defaultValue: Constants.ConfigNamespace }) namespace: string,
        @Arg("name") name: string,
        @Arg("value", () => Number) value: number
    ): string {
        return Settings.Set(namespace, name, value);
    }

    @Mutation(() => String, { nullable: true })
    setSettingBinary(
        @Arg("namespace", { defaultValue: Constants.ConfigNamespace }) namespace: string,
        @Arg("name") name: string,
        @Arg("file", () => GraphQLUpload) file: FileUpload
    ): string {
        Logging.Log(file);

        // Extract the file bytes
        const stream = file.createReadStream();
        return Settings.Set(namespace, name, stream.read());
    }

    @Mutation(() => String, { nullable: true })
    setSettingJSON(
        @Arg("namespace", { defaultValue: Constants.ConfigNamespace }) namespace: string,
        @Arg("name") name: string,
        @Arg("json", () => GraphQLJSON) value: string
    ): string {
        return Settings.Set(namespace, name, value);
    }

    @Mutation(() => String, { nullable: true })
    setSettingArray(
        @Arg("namespace", { defaultValue: Constants.ConfigNamespace }) namespace: string,
        @Arg("name") name: string,
        @Arg("action") action: AddRemoveOptions,
        @Arg("value", () => String) value: string
    ): string {
        let array: string[] = Settings.Get(namespace, name);

        // Append or remove all instances from the array
        if (Array.isArray(array)) {
            if (action == AddRemoveOptions.Add)
                array.push(value);
            else
                array = array.filter(cur => cur != value);
        } else return "Config value is not an array";

        return Settings.Set(namespace, name, array);
    }
}
