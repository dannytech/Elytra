import { ChatTextComponent } from "./ChatComponent.js";

export class ChatTextComponentFactory {
    /**
     * Wrap a plain string into a text component
     * @param {string} str The string to wrap
     * @returns {ChatTextComponent} The parsed component
     * @static
     */
    public static FromString(str: string): ChatTextComponent {
        return {
            text: str
        };
    }
}
