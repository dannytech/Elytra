import test from "ava";
import { ChatTextComponentFactory } from "./ChatTextComponentFactory";
import { ChatTextComponent } from "./ChatComponent";
import { ChatComponentFactory } from "./ChatComponentFactory";

test("Simple text component", t => {
    const component: ChatTextComponent = ChatTextComponentFactory.FromString("Hello, world!");

    // Very simple flat structure
    t.deepEqual(component, {
        text: "Hello, world!"
    });
});

test("Raw text from simple text component", async t => {
    const str = "Hello, world!";

    const component: ChatTextComponent = ChatTextComponentFactory.FromString(str);

    // Extract the text from the component
    t.is(await ChatComponentFactory.GetRaw(component), str);
});
