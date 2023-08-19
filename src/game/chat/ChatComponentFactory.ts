import { ChatComponent, ChatTextComponent } from "./ChatComponent";
import { Start, parse as chatParser } from "./ChatComponentParser";
import { ChatTranslationComponentFactory } from "./ChatTranslationComponentFactory";

export class ChatComponentFactory {
    /**
     * Convert a format string into a collection of nested chat components
     * @param {string} chatString The formatted string to convert
     * @param {Array<string | number | bigint>} [args] Optional translation parameters 
     * @returns {ChatComponent} A root chat component containing a list of nested components
     * @static
     */
    public static FromString(chatString: string, ...args: Array<string | number | bigint>[]): ChatComponent {
        const root: Start = chatParser(chatString, {
            args
        });

        // Collection array
        const components: ChatComponent[] = [];
        let current: ChatComponent = null;

        root.forEach((component, i) => {
            // Cache whether a reset was present, including on the first component
            const reset = "reset" in component && component.reset;

            // Delete the reset option on the component
            if (reset)
                delete component.reset;

            if (i == 0) 
                // Seed the first run
                components.push(current = component);
            else if (reset) {
                // Add a new root component
                current = component;
                components.push(current);
            } else {
                // Nest the current component in a parent component
                if (current.extra)
                    current.extra.push(component);
                else
                    current.extra = [component];

                current = component;
            }
        });

        // Wrap multiple components in a blank root chat component to fix inheritance
        if (components.length === 1)
            return components[0];
        else
            return { text: "", extra: components };
    }

    /**
     * Convert a text component and its children into a string
     * @param {ChatComponent} component The component to convert
     * @returns {string} The converted string
     * @static
     * @async
     */
    public static async GetRaw(component: ChatComponent): Promise<string> {
        let raw = "";

        // Append the element text
        if ("text" in component) raw += component.text;

        // Translate components server-side
        else if ("translate" in component) {
            const translatedComponent = await ChatTranslationComponentFactory.Mask(component) as ChatTextComponent;

            raw += translatedComponent.text;
        }

        // TODO Evaluate score components
        else if ("score" in component) null;

        // TODO Evaluate selector components
        else if ("selector" in component) null;

        // TODO Convert keybind components
        else if ("keybind" in component) null;

        // TODO Resolve NBT component
        else if ("nbt" in component) null;

        // Recurse through all the children
        if ("extra" in component)
            for (let i = 0; i < component.extra.length; i++) {
                raw += await this.GetRaw(component.extra[i]);
            }

        return raw;
    }
}
