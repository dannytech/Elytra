/**
 * Shared options for all component types
 * @property {string} [color] The text color
 * @property {string} [font] The text font
 * @property {boolean} [bold] Whether to bold the text
 * @property {boolean} [italic] Whether to italicize the text
 * @property {boolean} [underline] Whether to underline the text
 * @property {boolean} [strikethrough] Whether to strikethrough the text
 * @property {boolean} [obfuscated] Whether to obfuscate the text
 * @property {object[]} [extra] Child text components to inherit from this
 */
export type ComponentOptions = {
    color?: string;
    font?: "uniform" | "alt" | "default";
    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
    strikethrough?: boolean;
    obfuscated?: boolean;
    extra?: ChatComponent[];
};

/**
 * A plaintext component with optional formatting attributes
 * @property {string} text A string containing plain text
 */
export type ChatTextComponent = ComponentOptions & {
    text: string;
};

/**
 * A translatable component with values for translation slots
 * @property {string} translate A translation identifier for the client to parse
 * @property {Array<string | number | bigint>} [with] An array of text components to be inserted into translation slots
 */
export type ChatTranslationComponent = ComponentOptions & {
    translate: string;
    with?: Array<string | number | bigint>;
};

/**
 * A resolvable score component
 * @property {object} score A scoreboard identifier, requiring resolution to the underlying values
 * @property {string} score.name A player name or selector for the player(s) for which the score should be displayed
 * @property {string} score.objective The scoreboard objective identifier
 * @property {string} [score.value] A scoreboard value, used to override the actual value, bypassing resolution
 */
export type ChatScoreComponent = ComponentOptions & {
    score: {
        name: string;
        objective: string;
        value?: string;
    };
};

/**
 * A player selector component
 * @property {string} selector A selector for a collection of player(s)
 */
export type ChatSelectorComponent = ComponentOptions & {
    selector: string;
};

/**
 * A client keybind component
 * @property {string} keybind A client keybind identifier
 */
export type ChatKeybindComponent = ComponentOptions & {
    keybind: string;
};

/**
 * A resolvable NBT component
 * @property {string} nbt An NBT path type for looking up entities or storage
 * @property {boolean} [interpret] Whether or not to interpret the NBT data as JSON
 * @property {string} [block] A string containing the coordinates of a block for which to retrieve NBT value(s)
 * @property {string} [entity] A string containing the target selector for the entity(s) for which to retrieve NBT value(s)
 * @property {string} [storage] A string containing the storage identifier for which to retrieve NBT value(s)
 */
export type ChatNBTComponent = ComponentOptions & {
    nbt: string;
    interpret?: boolean;
    block?: string;
    entity?: string;
    storage?: string;
};

export type ChatComponent = ChatTextComponent | ChatTranslationComponent | ChatScoreComponent | ChatSelectorComponent | ChatKeybindComponent | ChatNBTComponent;
