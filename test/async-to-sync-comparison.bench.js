import { Bench } from "tinybench";
import redlet from "../src/redlet-node.js";
import { createWorker } from "await-sync";
import makeSynchronous from "make-synchronous";
import { createSyncFn } from "synckit";
import { readFile, writeFile } from "node:fs/promises";
import { appendFileSync, unlinkSync } from "node:fs";

await writeFile("test.log", "test\n".repeat(1000));
const testFile = process.cwd() + "/test.log";

const bench = new Bench({ time: 3000 });

// prettier-ignore
await writeFile("synckit-runAsWorker.mjs", `
  import { runAsWorker } from "synckit";
  runAsWorker(async (f) => {
    const { readFile } = await import("node:fs/promises");
    return await readFile(f);
  })
`
);
const synckit = createSyncFn(process.cwd() + "/synckit-runAsWorker.mjs");
bench.add("synckit", () => {
  synckit(testFile);
});

const tinylet = redlet(async (f) => {
  const { readFile } = await import("node:fs/promises");
  return await readFile(f);
});
bench.add("tinylet", () => {
  tinylet(testFile);
});

const await_sync = createWorker()(async (f) => {
  const { readFile } = await import("node:fs/promises");
  return await readFile(f);
});
bench.add("await-sync", () => {
  await_sync(testFile);
});

const make_synchronous = makeSynchronous(async (f) => {
  const { readFile } = await import("node:fs/promises");
  return await readFile(f);
});
bench.add("make-synchronous", () => {
  make_synchronous(testFile);
});

await bench.warmup();
await bench.run();
console.table(bench.table());
