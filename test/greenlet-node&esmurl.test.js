import test from "node:test";
import assert from "node:assert";
import esmurl from "esmurl";
import greenlet from "../src/greenlet-node.js";

test("greenlet(esmurl())", async () => {
  const u = esmurl(import.meta, async () => {
    const { default: isOdd } = await import("is-odd");
    return isOdd;
  });
  const remoteIsOdd = greenlet(u);

  assert.equal(await remoteIsOdd(1), true);
});
