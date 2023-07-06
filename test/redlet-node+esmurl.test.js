import test from "node:test";
import assert from "node:assert";
import esmurl from "esmurl";
import redlet from "../src/redlet-node.js";

test("redlet(esmurl())", async () => {
  const remoteIsOdd = redlet(
    esmurl(import.meta, async () => {
      const { default: isOdd } = await import("is-odd");
      return isOdd;
    }),
  );

  assert.equal(remoteIsOdd(1), true);
});
