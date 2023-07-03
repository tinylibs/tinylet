import { Bench } from "tinybench";
import greenlet from "../src/greenlet.js";

const bench = new Bench({ time: 1000 });

bench.add("create only", () => {
  greenlet(() => {});
});

bench.add("create + invoke worker", async () => {
  await greenlet(() => {})();
});

const f = greenlet(() => {});
bench.add("invoke worker only", async () => {
  await f();
});

await bench.run();
console.table(bench.table());
