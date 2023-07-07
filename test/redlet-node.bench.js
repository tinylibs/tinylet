import { Bench } from "tinybench";
import redlet from "../src/redlet-node.js";
import { createWorker } from "await-sync";

const awaitSync = createWorker();

const bench = new Bench({ time: 1000 });

bench.add("redlet: create only", () => {
  redlet(() => {});
});

bench.add("await-sync: create only", () => {
  awaitSync(() => new Uint8Array(1));
});

bench.add("redlet: create + invoke worker", () => {
  const f = redlet(() => {});
  f();
});

bench.add("await-sync: create + invoke worker", () => {
  const f = awaitSync(() => new Uint8Array(1));
  f();
});

{
  const f = redlet(() => {});
  bench.add("redlet: invoke worker only", () => {
    f();
  });
}

{
  const f = awaitSync(() => new Uint8Array(1));
  bench.add("await-sync: invoke worker only", () => {
    f();
  });
}

await bench.run();
console.table(bench.table());
