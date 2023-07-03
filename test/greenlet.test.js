import test from "node:test";
import assert from "node:assert";
import greenlet from "../src/greenlet.js";

test("greenlet((a, b) => a + b)", async () => {
  const green = greenlet((a, b) => a + b);

  await test("is a function", () => {
    assert.equal(typeof green, "function");
  });

  await test("returns a promise", async () => {
    const p = green();
    assert(p instanceof Promise);
    await p;
  });

  await test("green(1, 2) resolves to 3", async () => {
    assert.equal(await green(1, 2), 3);
  });
});
