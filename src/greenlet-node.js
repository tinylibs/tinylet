import { Worker as NodeWorker } from "node:worker_threads";

function URLCanParse(url) {
  try {
    new URL(url);
  } catch {
    return false;
  }
  return true;
}

function pEvent(eventEmitter, type, filter) {
  return new Promise((resolve, reject) => {
    const h1 = (e) => {
      if (filter && !filter(e)) {
        return;
      }
      resolve(e);
      abort();
    };
    const h2 = (e) => {
      reject(e);
      abort();
    };
    const abort = () => {
      eventEmitter.off(type, h1);
      eventEmitter.off("error", h2);
    };
    eventEmitter.on(type, h1);
    eventEmitter.on("error", h2);
  });
}

const controllerCode = `
import { parentPort } from "node:worker_threads";

const self = parentPort;
self.onmessage = async (e) => {
  const [channel, moduleURL, this_, arguments_] = e.data;
  /** @type {[string] | [void, any]} */
  let r;
  try {
    const module = await import(moduleURL);
    r = [await module.default.apply(this_, arguments_)];
  } catch (e) {
    r = [, e];
  }
  r.unshift(channel);
  self.postMessage(r);
};
`;

/** @type {{ worker: NodeWorker } | null | undefined} */
let cache;

/** @returns {NodeWorker} */
function getWorker() {
  if (!cache) {
    const u =
      "data:text/javascript;base64," +
      Buffer.from(controllerCode).toString("base64");
    const worker = new NodeWorker(`import(${JSON.stringify(u)})`, {
      eval: true,
      name: "greenlet",
    });
    worker.unref();
    cache = { worker };
  }
  return cache.worker;
}

/**
 * @template T
 * @template {any[]} A
 * @template R
 * @param {((this: T, ...args: A) => R) | string | URL} functionOrURL
 * @returns {(this: T, ...args: A) => Promise<R>}
 */
function greenlet(functionOrURL) {
  let executorURL;
  let maybeFunction;
  if (typeof functionOrURL === "function") {
    maybeFunction = functionOrURL;
    const code = `export default ${functionOrURL}`;
    executorURL =
      "data:text/javascript;base64," + Buffer.from(code).toString("base64");
  } else if (URLCanParse(functionOrURL)) {
    executorURL = functionOrURL;
  } else {
    const code = `export default ${functionOrURL}`;
    executorURL =
      "data:text/javascript;base64," + Buffer.from(code).toString("base64");
  }

  const { run } = {
    async run() {
      const channel = Math.random().toString();
      const worker = getWorker();
      const p = pEvent(worker, "message", (e) => e[0] === channel);
      worker.postMessage([channel, executorURL, this, [...arguments]]);
      const r = await p;
      if (r.length === 2) {
        return r[1];
      } else {
        throw r[2];
      }
    },
  };
  if (maybeFunction) {
    Object.defineProperties(
      run,
      Object.getOwnPropertyDescriptors(maybeFunction),
    );
  }

  return run;
}

export default greenlet;
