import { Bench } from "npm:tinybench";
import redlet from "../src/redlet-deno+default.js";
import greenlet from "../src/greenlet-deno+default.js";
import process from "node:process";

const bench = new Bench({ time: 1000 });

const g = greenlet((a, b) => a + b);
const r = redlet((a, b) => a + b);

bench.add("greenlet: 200x 'A' + 200x 'B' concat", async () => {
  await g("A".repeat(200), "B".repeat(200));
});

bench.add("redlet: 200x 'A' + 200x 'B' concat", () => {
  r("A".repeat(200), "B".repeat(200));
});

bench.add("greenlet: 1000x 'A' + 1000x 'B' concat", async () => {
  await g("A".repeat(1000), "B".repeat(1000));
});

bench.add("redlet: 1000x 'A' + 1000x 'B' concat", () => {
  r("A".repeat(1000), "B".repeat(1000));
});

bench.add("greenlet: 10kb 'A' + 10kb 'B' concat", async () => {
  await g("A".repeat(10 * 1024), "B".repeat(10 * 1024));
});

bench.add("redlet: 10kb 'A' + 10kb 'B' concat", () => {
  r("A".repeat(10 * 1024), "B".repeat(10 * 1024));
});

await bench.run();
console.table(bench.table());
process.exit();
