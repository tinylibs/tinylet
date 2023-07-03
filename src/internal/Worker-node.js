import workerThreads from "node:worker_threads";
import createContentURL from "./createContentURL-node.js";

const insideURL = createContentURL(
  `
    import workerThreads from "node:worker_threads";
    globalThis.addEventListener = (t, l) => {
      if (t === "message") {
        workerThreads.parentPort.on("message", (data) => l({ data }));
      }
    }
    globalThis.postMessage = (data) => workerThreads.parentPort.postMessage(data);
  `,
  "text/javascript"
);

export default function Worker(url, options) {
  const worker = new workerThreads.Worker(
    `import(${JSON.stringify(insideURL)})
      .then(()=>import(${JSON.stringify(url)}));`,
    {
      eval: true,
    }
  );
  worker.unref?.();
  const w = new WeakMap();
  worker.addEventListener = (t, l) => {
    if (t === "message") {
      const f = (data) => l({ data });
      w.set(l, f);
      worker.on("message", f);
    }
  };
  worker.removeEventListener = (t, l) => {
    if (t === "message") {
      worker.off("message", w.get(l));
    }
  };
  return worker;
}
