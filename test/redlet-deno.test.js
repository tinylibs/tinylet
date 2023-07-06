import assert from "node:assert";
import redlet from "../src/redlet.js";

const f = redlet((a, b) => a + b);

Deno.test("is a function", { sanitizeOps: false }, () => {
  assert.equal(typeof f, "function");
});

Deno.test("returns not a promise", { sanitizeOps: false }, () => {
  const p = f();
  assert(!(p instanceof Promise));
});

Deno.test("f(1, 2) is 3", { sanitizeOps: false }, () => {
  assert.equal(f(1, 2), 3);
});
