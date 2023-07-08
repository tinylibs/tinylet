import { Worker as NodeWorker } from "node:worker_threads";
import esmurl from "esmurl";
import URLCanParse from "./lib/URLCanParse.js";
import pEventEmitter from "./lib/pEventEmitter.js";

/** @returns {NodeWorker} */
function getWorker() {
  if (!getWorker.c) {
    const u = esmurl(import.meta, async () => {
      const { parentPort } = await import("node:worker_threads");
      const self = parentPort;
      /** @param {MessageEvent} e */
      // @ts-ignore
      self.onmessage = async (e) => {
        /** @type {[string, string, any, any[]]} */
        const [channel, moduleURL, that, args] = e.data;
        /** @type {[string] | [void, any]} */
        let r;
        try {
          const module = await import(moduleURL);
          const f = await module.default;
          r = [await f.apply(that, args)];
        } catch (e) {
          r = [, e];
        }
        self.postMessage([channel].concat(r));
      };
    });
    const worker = new NodeWorker(`import(${JSON.stringify(u)})`, {
      eval: true,
      // @ts-ignore
      name: "greenlet",
    });
    worker.unref();
    getWorker.c = worker;
  }
  return getWorker.c;
}
/** @type {NodeWorker | null | undefined} */
getWorker.c;

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

  /**
   * @this {T}
   * @returns {Promise<R>}
   */
  async function run() {
    const worker = getWorker();

    const channel = Math.random().toString();
    const p = pEventEmitter(worker, "message", (e) => e[0] === channel);
    worker.postMessage([channel, executorURL, this, [...arguments]]);
    /** @type {[any] | [void, any]} */
    const r = (await p).slice(1);

    if (r.length === 1) {
      return r[0];
    } else {
      throw r[1];
    }
  }

  return run;
}

export default greenlet;
