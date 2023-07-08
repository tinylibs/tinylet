import { greenlet, redlet } from "../src/index.js";
import esmurl from "esmurl";
import assert from "node:assert";
import test from "node:test";

test("greenlet() with esmurl()", async (t) => {
  let f;
  await t.test("create function", async () => {
    const u = esmurl(import.meta, async () => {
      const { default: isOdd } = await import("npm:is-odd");
      return isOdd;
    });
    f = greenlet(u);
  });

  let isItOdd;
  await t.test("call function", async () => {
    isItOdd = await f(1);
    assert.equal(isItOdd, true);
  });

  let isItOddAgain;
  await t.test("call function again", async () => {
    isItOddAgain = await f(100);
    assert.equal(isItOddAgain, false);
  });
});

test("redlet() with esmurl()", async (t) => {
  let f;
  await t.test("create function", async () => {
    const u = esmurl(import.meta, async () => {
      const { default: isOdd } = await import("npm:is-odd");
      return isOdd;
    });
    f = redlet(u);
  });

  let isItOdd;
  await t.test("call function", async () => {
    isItOdd = f(1);
    assert.equal(isItOdd, true);
  });

  let isItOddAgain;
  await t.test("call function again", async () => {
    isItOddAgain = f(100);
    assert.equal(isItOddAgain, false);
  });
});
