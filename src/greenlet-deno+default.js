import esmurl from "esmurl";
import pEventTarget from "./lib/pEventTarget.js";
import URLCanParse from "./lib/URLCanParse.js";

/**
 * @returns {Worker}
 */
function getWorker() {
  if (!getWorker.c) {
    const u = esmurl(import.meta, () => {
      globalThis.onmessage = async (e) => {
        /** @type {[string, string, any, any[]]} */
        const [channel, moduleURL, that, args] = e.data;
        /** @type {[any] | [void, any]} */
        let r;
        try {
          const module = await import(moduleURL);
          const f = await module.default;
          r = [await f.apply(that, args)];
        } catch (e) {
          r = [, e];
        }
        globalThis.postMessage([channel].concat(r));
      };
    });
    getWorker.c = new Worker(u, { type: "module", name: "greenlet" });
  }
  return getWorker.c;
}
/** @type {Worker | null | undefined} */
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
    executorURL = URL.createObjectURL(
      new Blob([code], { type: "text/javascript" })
    );
  } else if (URLCanParse(functionOrURL)) {
    executorURL = functionOrURL;
  } else {
    const code = `export default ${functionOrURL}`;
    executorURL = URL.createObjectURL(
      new Blob([code], { type: "text/javascript" })
    );
  }

  /**
   * @this {T}
   * @returns {Promise<R>}
   */
  async function run() {
    const worker = getWorker();

    const channel = Math.random().toString();
    const p = pEventTarget(
      worker,
      "message",
      /** @param {MessageEvent} e */ (e) => e.data[0] === channel
    );
    worker.postMessage([channel, executorURL, this, [...arguments]]);
    const e = await p;
    /** @type {[any] | [void, any]} */
    const r = e.data.slice(1);

    if (r.length === 1) {
      return r[0];
    } else {
      throw r[1];
    }
  }

  return run;
}

export default greenlet;
