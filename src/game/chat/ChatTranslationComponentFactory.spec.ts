import { Socket } from "net";
import anyTest, { TestFn } from "ava";
import { ChatTranslationComponentFactory } from "./ChatTranslationComponentFactory";
import { Client } from "../../protocol/Client";
import { Locale } from "../Locale";

const test = anyTest as TestFn<Client>;

test.before(async () => {
    await Locale.Load();
});

test.beforeEach(t => {
    t.context = new Client(new Socket(), 1);

    t.context.Protocol.version = 1;
    t.context.Locale = "en_US";
});

test("Simple translation", t => {
    const key = "translation.test.none";
    const component = ChatTranslationComponentFactory.FromKey(key);

    t.deepEqual(component, {
        translate: key
    });
});

test("Translation with arguments", t => {
    const key = "translation.test.args";
    const component = ChatTranslationComponentFactory.FromKey(key, "arg1", "arg2");

    t.deepEqual(component, {
        translate: key,
        with: [
            "arg1",
            "arg2"
        ]
    });
});

test("Masking with supported client", t => {
    const key = "translation.test.none";

    t.context.Protocol.version = 578;

    // Create the translation component
    const component = ChatTranslationComponentFactory.FromKey(key);

    // Attempt to convert it to a text component
    const masked = ChatTranslationComponentFactory.Mask(t.context, component);

    t.is(masked, component);
});

test("Masking without arguments", t => {
    const key = "translation.test.none";

    // Create the translation component
    const component = ChatTranslationComponentFactory.FromKey(key);

    // Convert it to a text component
    const masked = ChatTranslationComponentFactory.Mask(t.context, component);

    t.deepEqual(masked, {
        text: "Hello, world!"
    });
});

test("Masking with arguments", t => {
    const key = "translation.test.args";

    // Create the translation component
    const component = ChatTranslationComponentFactory.FromKey(key, "arg1", "arg2");

    // Convert it to a text component
    const masked = ChatTranslationComponentFactory.Mask(t.context, component);

    t.deepEqual(masked, {
        text: "arg1 arg2"
    });
});

test("Masking with missing arguments", t => {
    const key = "translation.test.args";

    // Create the translation component
    const component = ChatTranslationComponentFactory.FromKey(key);

    // Convert it to a text component
    const masked = ChatTranslationComponentFactory.Mask(t.context, component);

    t.deepEqual(masked, {
        text: " "
    });
});

test("Masking with escape characters", t => {
    const key = "translation.test.escape";

    // Create the translation component
    const component = ChatTranslationComponentFactory.FromKey(key, "arg1", "arg2");

    // Convert it to a text component
    const masked = ChatTranslationComponentFactory.Mask(t.context, component);

    t.deepEqual(masked, {
        text: "%s %arg1 %%s %%arg2"
    });
});

test("Masking with an invalid key", t => {
    const key = "translation.test.doesntexist";

    // Create the translation component
    const component = ChatTranslationComponentFactory.FromKey(key, "arg1", "arg2");

    // Convert it to a text component
    const masked = ChatTranslationComponentFactory.Mask(t.context, component);

    t.deepEqual(masked, {
        text: key
    });
});

test("Masking with a malformed key", t => {
    const key = "translation.test.invalid2";

    // Create the translation component
    const component = ChatTranslationComponentFactory.FromKey(key, "arg1", "arg2");

    // Convert it to a text component
    const masked = ChatTranslationComponentFactory.Mask(t.context, component);

    t.deepEqual(masked, {
        text: "hi % s"
    });
});
