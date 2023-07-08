import { greenlet, redlet } from "../src/index.js";
import esmurl from "npm:esmurl";
import assert from "node:assert";

Deno.test("greenlet() with esmurl()", async (t) => {
  let f;
  await t.step("create function", async () => {
    const u = esmurl(import.meta, async () => {
      const { default: isOdd } = await import("npm:is-odd");
      return isOdd;
    });
    f = greenlet(u);
  });

  let isItOdd;
  await t.step("call function", async () => {
    isItOdd = await f(1);
    assert.equal(isItOdd, true);
  });

  let isItOddAgain;
  await t.step("call function again", async () => {
    isItOddAgain = await f(100);
    assert.equal(isItOddAgain, false);
  });
});

Deno.test("redlet() with esmurl()", async (t) => {
  let f;
  await t.step("create function", async () => {
    const u = esmurl(import.meta, async () => {
      const { default: isOdd } = await import("npm:is-odd");
      return isOdd;
    });
    f = redlet(u);
  });

  let isItOdd;
  await t.step("call function", async () => {
    isItOdd = f(1);
    assert.equal(isItOdd, true);
  });

  let isItOddAgain;
  await t.step("call function again", async () => {
    isItOddAgain = f(100);
    assert.equal(isItOddAgain, false);
  });
});
