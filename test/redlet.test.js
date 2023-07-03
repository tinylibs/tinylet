import test from "node:test";
import assert from "node:assert";
import { Bench } from "tinybench";
import redlet from "../src/redlet.js";

test("redlet((a, b) => a + b)", async () => {
  const red = redlet((a, b) => a + b);

  await test("is a function", () => {
    assert.equal(typeof red, "function");
  });

  await test("doesn't return a promise", () => {
    const p = red();
    assert(!(p instanceof Promise));
  });

  await test("red(1, 2) is 3", () => {
    assert.equal(red(1, 2), 3);
  });
});

test("redlet() benchmark", async () => {
  const bench = new Bench({ time: 100 });

  bench.add("redlet(() => {})", () => {
    redlet(() => {});
  });

  bench.add("redlet(() => {})()", () => {
    redlet(() => {})();
  });

  {
    const red = redlet(() => {});
    bench.add("eager red()", () => {
      red();
    });
  }

  {
    let red;
    bench.add("lazy red()", () => {
      red ??= redlet(() => {});
      red();
    });
  }

  await bench.run();
  console.table(bench.table());
});
