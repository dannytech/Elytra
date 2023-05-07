import test from "ava";
import { ChatTextComponentFactory } from "./ChatTextComponentFactory";
import { ChatTextComponent } from "./ChatComponent";

test("Simple component", t => {
    const component: ChatTextComponent = ChatTextComponentFactory.FromString("Hello, world!");

    // Very simple flat structure
    t.deepEqual(component, {
        text: "Hello, world!"
    });
});

test("Complex component", t => {
    const component = ChatTextComponentFactory.FromFormattedString("&l&eHello, &n&bworld!");

    // Deeply nested structure
    t.deepEqual(component, {
        text: "Hello, ",
        color: "yellow",
        extra: [
            {
                text: "world!",
                color: "aqua",
                underline: true
            }
        ],
        bold: true
    });
});

test("Complex component with reset", t => {
    const component = ChatTextComponentFactory.FromFormattedString("&dHello, &r&a&kworld!");

    // Flattened structure due to reset
    t.deepEqual(component, {
        text: "",
        color: "reset",
        extra: [
            {
                text: "Hello, ",
                color: "light_purple"
            },
            {
                text: "world!",
                color: "green",
                obfuscated: true
            }
        ]
    });
});

test("Raw text from simple component", t => {
    const str = "Hello, world!";

    const component: ChatTextComponent = ChatTextComponentFactory.FromString(str);

    // Extract the text from the component
    t.is(ChatTextComponentFactory.GetRaw(component), str);
});

test("Raw text from complex component", t => {
    const component = ChatTextComponentFactory.FromFormattedString("&l&6Hello, &r&8world!");

    // Flatten and extract the text from the component
    t.is(ChatTextComponentFactory.GetRaw(component), "Hello, world!");
});
