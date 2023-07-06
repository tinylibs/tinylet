import test from "node:test";
import assert from "node:assert";
import redlet from "../src/redlet-node.js";

const f = redlet((a, b) => a + b);

test("is a function", () => {
  assert.equal(typeof f, "function");
});

test("returns not a promise", () => {
  const p = f();
  assert(!(p instanceof Promise));
});

test("f(1, 2) is 3", () => {
  assert.equal(f(1, 2), 3);
});
