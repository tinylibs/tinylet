import { writeFile } from "node:fs/promises";
import { Bench } from "tinybench";
import { createWorker } from "await-sync";
import makeSynchronous from "make-synchronous";
import { createSyncFn } from "synckit";
import redlet from "../src/redlet-node.js";
import { unlinkSync } from "node:fs";

const bench = new Bench({ time: 3000 });

// prettier-ignore
await writeFile("synckit-runAsWorker (1).mjs", `
  import { runAsWorker } from "synckit";
  runAsWorker(() => {});
`);
process.on("exit", () => {
  unlinkSync("synckit-runAsWorker (1).mjs");
});
const synckit_noop = createSyncFn(
  process.cwd() + "/synckit-runAsWorker (1).mjs"
);
bench.add("noop: synckit", () => {
  synckit_noop();
});

const tinylet_noop = redlet(() => {});
bench.add("noop: tinylet", () => {
  tinylet_noop();
});

const await_sync_noop = createWorker()(() => {});
bench.add("noop: await-sync", () => {
  await_sync_noop();
});

const make_synchronous_noop = makeSynchronous(() => {});
bench.add("noop: make-synchronous", () => {
  make_synchronous_noop();
});

await bench.warmup();
await bench.run();
console.table(bench.table());
process.exit();
