import test from "ava";
import { DummyMinecraftConfig, Settings } from "./Configuration";
import { Database } from "./database/Database";
import * as crypto from "crypto";

test.before(async t => {
    Settings.Load();

    await Database.Connect();
});

test.serial("Load environment", t => {
    t.notThrows(Settings.Load);

    t.not(process.env.RDB_URI, null);
});

test.serial("Cache configs", async t => {
    await t.notThrowsAsync(Settings.Cache);
});

test.serial("Get and set config", t => {
    // Generate random test data
    const garbage: Buffer = crypto.randomBytes(16);
    Settings.Set(DummyMinecraftConfig, garbage);

    const result: Buffer = Settings.Get(DummyMinecraftConfig);

    t.is(result, garbage);
});

test.serial("Invalid config", t => {
    t.is(Settings.Get("minecraft", "badConfig"), null);
});
