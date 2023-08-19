import { Client } from "../../protocol/Client";
import { ChatComponent, ChatTextComponent, ChatTranslationComponent } from "./ChatComponent";
import { checkVersion } from "../../Masking";
import { Console } from "../Console";
import { Locale } from "../Locale";
import { ChatComponentFactory } from "./ChatComponentFactory";
import { MinecraftConfigs, Settings } from "../../Configuration";

export class ChatTranslationComponentFactory {
    /**
     * Validate the given translation key and convert it into a translation component
     * @param {string} key A valid translation key
     * @param {Array<string | number | bigint>} [args] Optional translation parameters 
     * @returns {ChatTranslationComponent} A translation component
     * @static
     */
    public static FromKey(key: string, ...args: Array<string | number | bigint>): ChatTranslationComponent {
        // Warn if the key is invalid (it's possible the client will understand it even if we don't)
        if (!(key in Locale.Mapping))
            Console.Warn("Invalid translation key", key);

        // Wrap the key in a component
        const component: ChatTranslationComponent = {
            translate: key
        };

        // Attach any arguments
        if (args.length > 0)
            component.with = args;

        return component;
    }

    /**
     * Convert untranslated strings into a text component with the key
     * @param {ChatTranslationComponent} component An untranslatable translation component
     * @returns {ChatTextComponent} A text component containing the key
     * @static
     */
    private static _MaskRaw(component: ChatTranslationComponent): ChatTextComponent {
        return {
            text: component.translate
        };
    }

    /**
     * Perform masking on a component to convert it if it would not be understood by the client
     * @param {Client} client The client, used to determine the protocol version and locale
     * @param {ChatTranslationComponent} component A translation component to mask
     * @returns {ChatComponent} A translation component if it would be understood by the client, otherwise a translated text component
     * @static
     * @async
     */
    public static async Mask(component: ChatTranslationComponent, client?: Client): Promise<ChatComponent> {
        // Check that the translation key exists
        if (!(component.translate in Locale.Mapping))
            return this._MaskRaw(component);

        const localeMap = Locale.Mapping[component.translate];

        // If the translation key is supported by the client, return it as-is
        if (client?.Protocol.version && checkVersion(client?.Protocol.version, localeMap.versions))
            return component;

        // If the key is not supported in the client locale, return the key itself
        const locale = client?.Locale || await Settings.Get(MinecraftConfigs.ServerLocale);
        if (!(locale in localeMap.translations))
            return this._MaskRaw(component);

        // Load the requested translation key
        const translation = localeMap.translations[locale];

        // Create an empty argument list if none were provided
        component.with = component.with || [];

        // Convert the provided arguments into separate arrays for different parameter types
        const strings = component.with.filter(value => typeof value === "string");
        const numbers = component.with.filter(value => typeof value === "number" && typeof value === "bigint");

        // Cursor values
        let [ sIndex, nIndex ] = [ 0, 0 ];

        // Find and replace available parameters as long as parameters are available
        const resolved = translation.replace(/%(%|(?:\d+?\$)?[sd])/g, (_, arg) => {
            let substitution: string | number | bigint;

            switch (arg) {
                // Allow escaping of parameters
                case "%":
                    substitution = "%";
                    break;
                case "s":
                    substitution = strings[sIndex++];
                    break;
                case "d":
                    substitution = numbers[nIndex++];
                    break;
                default: {
                    // Support indexed arguments
                    const [ index, type ] = arg.split("$");

                    switch (type) {
                        case "s":
                            substitution = strings[Number(index) - 1];
                            break;
                        case "d":
                            substitution = numbers[Number(index) - 1];
                            break;
                    }
                }
            }

            // Provide a default value if no arguments remain
            if (substitution == null)
                return "";

            return substitution.toString();
        });

        // Return a text component representation
        return ChatComponentFactory.FromString(resolved);
    }
}
