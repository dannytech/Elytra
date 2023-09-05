import test from "ava";
import { Environment, State } from "./State";

test("Get environment", t => {
    t.is(State.Environment, Environment.TEST);
});
