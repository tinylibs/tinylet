import test from "node:test";
import assert from "node:assert";
import * as index from "../src/index.js";

test("exports nothing", () => {
  assert.deepEqual(Object.keys(index), []);
});
