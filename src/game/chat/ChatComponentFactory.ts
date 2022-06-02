import { ChatComponent, ChatTextComponent } from "./ChatComponent";

interface ParsableString {
    string: string,
    reset: boolean,
    cursor: number
}

export class ChatComponentFactory {
    /**
     * Parse a text component from the given string containing formatting codes.
     * @param {ParsableString} parsable The string to parse, wrapped with a cursor.
     * @returns {ChatTextComponent} A parsed JSON object containing text and formatting.
     * @static
     */
    private static ParseFormattedString(parsable: ParsableString) : ChatTextComponent {
        const component: ChatTextComponent = {
            text: "",
            extra: new Array<ChatTextComponent>()
        };
        let escaped: boolean = false;
        let formatting: boolean = false;

        while (parsable.cursor < parsable.string.length) {
            let char: string = parsable.string[parsable.cursor];
            let skip: boolean = false; // Whether to skip adding the current character, if it has already been processed

            if (!escaped) {
                if (char == "\\") {
                    escaped = skip = true; // Escape the next character (and skip adding the current one)
                } else if (formatting) {
                    switch (char) {
                        // Color codes
                        case "0":
                            component.color = "black";
                            break;
                        case "1":
                            component.color = "dark_blue";
                            break;
                        case "2":
                            component.color = "dark_green";
                            break;
                        case "3":
                            component.color = "dark_aqua";
                            break;;
                        case "4":
                            component.color = "dark_red";
                            break;
                        case "5":
                            component.color = "dark_purple";
                            break;
                        case "6":
                            component.color = "gold";
                            break;
                        case "7":
                            component.color = "gray";
                            break;
                        case "8":
                            component.color = "dark_gray";
                            break;
                        case "9":
                            component.color = "blue";
                            break;
                        case "a":
                            component.color = "green";
                            break;
                        case "b":
                            component.color = "aqua";
                            break;
                        case "c":
                            component.color = "red";
                            break;
                        case "d":
                            component.color = "light_purple";
                            break;
                        case "e":
                            component.color = "yellow";
                            break;
                        case "f":
                            component.color = "white";
                            break;
                        case "#":
                            throw new Error("Hex color codes not implemented");

                        // Formatting codes
                        case "k":
                            component.obfuscated = true;
                            break;
                        case "l":
                            component.bold = true;
                            break;
                        case "m":
                            component.strikethrough = true;
                            break;
                        case "n":
                            component.underline = true;
                            break;
                        case "o":
                            component.italic = true;
                            break;
                        case "r":
                            // Break out of the component tree
                            parsable.reset = true;

                            // Skip the "r" since skipping is disabled
                            parsable.cursor++;

                            break;
                    }

                    formatting = false;
                    skip = true;
                } else if (char == "&") {
                    if (component.text.length > 0) {
                        // Continue processing as a subcomponent, which will inherit all existing styles
                        const subcomponent = this.ParseFormattedString(parsable);

                        // Only append if there's actual text left
                        if (subcomponent.text.length > 0)
                            component.extra.push(subcomponent);
                    }

                    formatting = true;
                }
            }

            // If the character did not have any special meaning, simply append it
            if (!formatting && !skip) component.text += char;

            // If this character was escaped, reset escaping
            if (!skip && escaped) escaped = false;

            // Stop processing the current component and leave the tree
            if (parsable.reset) break;

            // Set everything up for the next loop
            parsable.cursor++;
        }

        if (component.extra.length === 0) delete component.extra;

        return component;
    }

    /**
     * Wrap a plain string into a text component.
     * @param {string} str The string to wrap.
     * @returns {ChatTextComponent} The parsed component.
     * @static
     *
     */
     public static FromString(str: string) : ChatTextComponent {
        return {
            text: str
        };
    }

    /**
     * Parse an entire formatted string into JSON.
     * @param {string} str The string to parse.
     * @returns {ChatTextComponent} The parsed component.
     * @static
     */
    public static FromFormattedString(str: string) : ChatTextComponent {
        const parsable: ParsableString = {
            string: str,
            reset: false,
            cursor: 0
        };

        // Pack components into a single top-level component
        const root: ChatTextComponent = {
            text: "",
            extra: new Array<ChatTextComponent>(),
            color: "reset"
        };

        // Parse the string until the cursor reaches the end
        while (parsable.cursor < parsable.string.length) {
            // Clear the reset flag to continue processing
            parsable.reset = false;

            const subcomponent = this.ParseFormattedString(parsable);

            root.extra.push(subcomponent);
        }

        return root;
    }

    /**
     * Convert a text component and its children into a string.
     * @param {ChatComponent} component The component to convert.
     * @returns {string} The converted string.
     * @static
     */
    public static GetRaw(component: ChatComponent) : string {
        let raw: string = "";

        // Append the element text
        if ("text" in component) raw += component.text;

        // Recurse through all the children
        if ("extra" in component)
            for (let i = 0; i < component.extra.length; i++) {
                raw += this.GetRaw(component.extra[i]);
            }

        return raw;
    }
}
