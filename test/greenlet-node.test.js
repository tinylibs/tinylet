import test from "node:test";
import assert from "node:assert";
import greenlet from "../src/greenlet-node.js";

const f = greenlet((a, b) => a + b);

test("is a function", () => {
  assert.equal(typeof f, "function");
});

test("returns a promise", async () => {
  const p = f();
  assert(p instanceof Promise);
  await p;
});

test("f(1, 2) resolves to 3", async () => {
  assert.equal(await f(1, 2), 3);
});
