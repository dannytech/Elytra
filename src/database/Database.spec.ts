import test from "ava";
import { Settings } from "../Configuration";
import { Database } from "./Database";

test.before(() => {
    Settings.Load();
});

test("Connect and bind", async t => {
    await Database.Connect();

    t.true(Database.Connected);
});
