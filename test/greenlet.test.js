import test from "node:test";
import assert from "node:assert";
import { Bench } from "tinybench";
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

test("greenlet() benchmark", async () => {
  const bench = new Bench({ time: 100 });

  bench.add("greenlet(() => {})", () => {
    greenlet(() => {});
  });

  bench.add("greenlet(() => {})()", async () => {
    await greenlet(() => {})();
  });

  {
    const green = greenlet(() => {});
    bench.add("eager green()", async () => {
      await green();
    });
  }

  {
    let green;
    bench.add("lazy green()", async () => {
      green ??= greenlet(() => {});
      await green();
    });
  }

  await bench.run();
  console.table(bench.table());
});
