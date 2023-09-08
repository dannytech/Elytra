import test from "ava";
import { Settings } from "./Configuration";

test.serial("Load environment", t => {
    t.notThrows(Settings.Load);

    t.not(process.env.RDB_URI, null);
});
