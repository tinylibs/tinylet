import { Bench } from "tinybench";
import redlet from "../src/redlet-node.js";

const bench = new Bench({ time: 1000 });

bench.add("create only", () => {
  redlet(() => {});
});

bench.add("create + invoke worker", () => {
  const f = redlet(() => {});
  f();
});

const f = redlet(() => {});
bench.add("invoke worker only", () => {
  f();
});

await bench.run();
console.table(bench.table());
