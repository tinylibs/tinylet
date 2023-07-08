import { Bench } from "npm:tinybench";
import redlet from "../src/redlet-deno+default.js";
import { createWorker } from "npm:await-sync";
import { writeFile } from "node:fs/promises";
import { unlinkSync } from "node:fs";
import process from "node:process";

await writeFile("test.log", "test\n".repeat(1000));
process.on("exit", () => {
  unlinkSync("test.log");
});
const testFile = process.cwd() + "/test.log";

const bench = new Bench({ time: 3000 });

const tinylet_readFile = redlet(async (f) => {
  const { readFile } = await import("node:fs/promises");
  return await readFile(f);
});
bench.add("tinylet readFile()", () => {
  tinylet_readFile(testFile);
});

const await_sync_readFile = createWorker()(async (f) => {
  const { readFile } = await import("node:fs/promises");
  return await readFile(f);
});
bench.add("await-sync readFile()", () => {
  await_sync_readFile(testFile);
});

await bench.warmup();
await bench.run();
console.table(bench.table());
process.exit();
