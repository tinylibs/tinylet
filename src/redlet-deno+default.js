import esmurl from "esmurl";
import URLCanParse from "./lib/URLCanParse.js";

/** @returns {Worker} */
function getWorker() {
  if (!getWorker.c) {
    const u = esmurl(import.meta, async () => {
      globalThis.onmessage = async (e) => {
        /** @type {[SharedArrayBuffer, string, any, any[], SharedArrayBuffer]} */
        const [lockBuffer, moduleURL, that, args, returnValueBuffer] = e.data;
        const lock = new Int32Array(lockBuffer);

        /** @type {[any] | [void, any]} */
        let r;
        try {
          const module = await import(moduleURL);
          const f = await module.default;
          r = [await f.apply(that, args)];
        } catch (e) {
          r = [, e];
        }

        /** @type {Uint8Array} */
        let returnValueBytes;
        try {
          const x = JSON.stringify(r);
          returnValueBytes = new TextEncoder().encode(x);
        } catch (e) {
          const x = JSON.stringify([, "<unserializable>"]);
          returnValueBytes = new TextEncoder().encode(x);
        }

        // @ts-ignore
        returnValueBuffer.grow(returnValueBytes.byteLength);
        // @ts-ignore
        new Uint8Array(returnValueBuffer).set(returnValueBytes);
        Atomics.store(lock, 0, 1);
        Atomics.notify(lock, 0);
      };
    });
    getWorker.c = new Worker(u, { name: "redlet", type: "module" });
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
 * @returns {(this: T, ...args: A) => Awaited<R>}
 */
function redlet(functionOrURL) {
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

  function run() {
    const worker = getWorker();

    const lockBuffer = new SharedArrayBuffer(4);
    const lock = new Int32Array(lockBuffer);
    // @ts-ignore
    const returnValueBuffer = new SharedArrayBuffer(0, {
      maxByteLength: 64 * 1024,
    });
    worker.postMessage([
      lockBuffer,
      executorURL,
      this,
      [...arguments],
      returnValueBuffer,
    ]);
    Atomics.wait(lock, 0, 0);
    const r = JSON.parse(new TextDecoder().decode(returnValueBuffer));

    if (r.length === 1) {
      return r[0];
    } else {
      throw r[1];
    }
  }

  return run;
}

export default redlet;
