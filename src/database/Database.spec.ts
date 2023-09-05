import test from "ava";
import { Database } from "./Database";
import { Settings } from "../Configuration";

test.before(() => {
    Settings.Load();
});

test("Connect and bind", async t => {
    await Database.Connect();

    t.true(Database.Connected);
});
