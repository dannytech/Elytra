import { ChatTextComponent } from "./ChatComponent";

interface ParsableString {
    string: string,
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
                        case "r":
                            component.color = "reset";

                            // Nest into the next component
                            component.extra.push(this.ParseFormattedString(parsable));
                            break;

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
                    }

                    formatting = false;
                    skip = true;
                } else if (char == "&") {
                    if (component.text.length > 0) component.extra.push(this.ParseFormattedString(parsable));
                    
                    formatting = true;
                }
            }

            // If the character did not have any special meaning, simply append it
            if (!formatting && !skip) component.text += char;

            // If this character was escaped, reset escaping
            if (!skip && escaped) escaped = false;

            // Set everything up for the next loop
            parsable.cursor++;
        }

        if (component.extra.length === 0) delete component.extra;

        return component;
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
            cursor: 0
        };

        // Parse until the end of the string is reached
        return this.ParseFormattedString(parsable);
    }
}
