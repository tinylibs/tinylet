import test from "node:test";
import assert from "node:assert";
import esmurl from "esmurl";
import greenlet from "../src/greenlet.js";

test("greenlet(esmurl())", async () => {
  const remoteIsOdd = greenlet(
    esmurl(import.meta, async () => {
      const { default: isOdd } = await import("is-odd");
      return isOdd;
    })
  );

  assert.equal(await remoteIsOdd(1), true);
});
