import { Bench } from "tinybench";
import redlet from "../src/redlet-node.js";
import { createWorker } from "await-sync";
import makeSynchronous from "make-synchronous";
import { createSyncFn } from "synckit";
import { writeFile } from "node:fs/promises";
import { unlinkSync } from "node:fs";

const bench = new Bench({ time: 3000 });

await writeFile("test.log", "test\n".repeat(1000));
process.on("exit", () => {
  unlinkSync("test.log");
});
const testFile = process.cwd() + "/test.log";

// prettier-ignore
await writeFile("synckit-runAsWorker (2).mjs", `
  import { runAsWorker } from "synckit";
  runAsWorker(async (f) => {
    const { readFile } = await import("node:fs/promises");
    return await readFile(f);
  })
`);
process.on("exit", () => {
  unlinkSync("synckit-runAsWorker (2).mjs");
});
const synckit_readFile = createSyncFn(
  process.cwd() + "/synckit-runAsWorker (2).mjs"
);
bench.add("readFile(): synckit", () => {
  synckit_readFile(testFile);
});

const tinylet_readFile = redlet(async (f) => {
  const { readFile } = await import("node:fs/promises");
  return await readFile(f);
});
bench.add("readFile(): tinylet", () => {
  tinylet_readFile(testFile);
});

const await_sync_readFile = createWorker()(async (f) => {
  const { readFile } = await import("node:fs/promises");
  return await readFile(f);
});
bench.add("readFile(): await-sync", () => {
  await_sync_readFile(testFile);
});

const make_synchronous_readFile = makeSynchronous(async (f) => {
  const { readFile } = await import("node:fs/promises");
  return await readFile(f);
});
bench.add("readFile(): make-synchronous", () => {
  make_synchronous_readFile(testFile);
});

await bench.warmup();
await bench.run();
console.table(bench.table());
process.exit();
