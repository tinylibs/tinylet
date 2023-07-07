import test from "node:test";
import assert from "node:assert";
import * as index from "../src/index.js";

test("exports greenlet", () => {
  assert.equal("greenlet" in index, true);
});

test("exports redlet", () => {
  assert.equal("redlet" in index, true);
});
