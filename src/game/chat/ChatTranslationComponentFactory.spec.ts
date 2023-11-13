import { Socket } from "net";
import anyTest, { TestFn } from "ava";
import { ChatTranslationComponentFactory } from "./ChatTranslationComponentFactory";
import { Client } from "../../protocol/Client";
import { Locale } from "../Locale";
import { Database } from "../../Database";
import { Settings } from "../../Configuration";

const test = anyTest as TestFn<Client>;

test.before(async () => {
    // Connect to the database to load default locale information
    Settings.Load();
    await Database.Connect();

    // Load translation strings
    await Locale.Load();
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

test("Masking with supported client", async t => {
    const key = "translation.test.none";

    // Dummy client version
    const dummyClient = new Client(new Socket(), 1);
    dummyClient.Protocol.version = 578;

    // Create the translation component
    const component = ChatTranslationComponentFactory.FromKey(key);

    // Attempt to convert it to a text component
    const masked = await ChatTranslationComponentFactory.Mask(component, dummyClient);

    t.is(masked, component);
});

test("Masking without arguments", async t => {
    const key = "translation.test.none";

    // Create the translation component
    const component = ChatTranslationComponentFactory.FromKey(key);

    // Convert it to a text component
    const masked = await ChatTranslationComponentFactory.Mask(component);

    t.deepEqual(masked, {
        text: "Hello, world!"
    });
});

test("Masking with arguments", async t => {
    const key = "translation.test.args";

    // Create the translation component
    const component = ChatTranslationComponentFactory.FromKey(key, "arg1", "arg2");

    // Convert it to a text component
    const masked = await ChatTranslationComponentFactory.Mask(component);

    t.deepEqual(masked, {
        text: "arg1 arg2"
    });
});

test("Masking with missing arguments", async t => {
    const key = "translation.test.args";

    // Create the translation component
    const component = ChatTranslationComponentFactory.FromKey(key);

    // Convert it to a text component
    const masked = await ChatTranslationComponentFactory.Mask(component);

    t.deepEqual(masked, {
        text: " "
    });
});

test("Masking with escape characters", async t => {
    const key = "translation.test.escape";

    // Create the translation component
    const component = ChatTranslationComponentFactory.FromKey(key, "arg1", "arg2");

    // Convert it to a text component
    const masked = await ChatTranslationComponentFactory.Mask(component);

    t.deepEqual(masked, {
        text: "%s %arg1 %%s %%arg2"
    });
});

test("Masking with indexed parameters", async t => {
    const key = "translation.test.complex";

    // Create the translation component
    const component = ChatTranslationComponentFactory.FromKey(key, "arg1", "arg2", "arg3");

    // Convert it to a text component
    const masked = await ChatTranslationComponentFactory.Mask(component);

    t.deepEqual(masked, {
        text: "Prefix, arg1arg2 again arg2 and arg1 lastly arg3 and also arg1 again!"
    });
});

test("Masking with an invalid key", async t => {
    const key = "translation.test.doesntexist";

    // Create the translation component
    const component = ChatTranslationComponentFactory.FromKey(key, "arg1", "arg2");

    // Convert it to a text component
    const masked = await ChatTranslationComponentFactory.Mask(component);

    t.deepEqual(masked, {
        text: key
    });
});

test("Masking with a malformed key", async t => {
    const key = "translation.test.invalid2";

    // Create the translation component
    const component = ChatTranslationComponentFactory.FromKey(key, "arg1", "arg2");

    // Convert it to a text component
    const masked = await ChatTranslationComponentFactory.Mask(component);

    t.deepEqual(masked, {
        text: "hi % s"
    });
});
