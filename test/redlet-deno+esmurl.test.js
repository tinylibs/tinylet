import assert from "node:assert";
import esmurl from "npm:esmurl";
import redlet from "../src/redlet.js";

Deno.test("redlet(esmurl())", { sanitizeOps: false }, async () => {
  const remoteIsOdd = redlet(
    esmurl(import.meta, async () => {
      const { default: isOdd } = await import("npm:is-odd");
      return isOdd;
    })
  );

  assert.equal(remoteIsOdd(1), true);
});
