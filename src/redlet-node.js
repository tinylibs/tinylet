import {
  Worker as NodeWorker,
  receiveMessageOnPort,
} from "node:worker_threads";
import esmurl from "esmurl";
import URLCanParse from "./lib/URLCanParse.js";

/** @returns {MessagePort} */
function getPort() {
  if (!getPort.c) {
    const { port1, port2 } = new MessageChannel();
    // @ts-ignore
    port1.unref();
    // @ts-ignore
    port2.unref();
    const u = esmurl(import.meta, async () => {
      const { workerData } = await import("node:worker_threads");
      const port = workerData.port;
      /** @type {((...a: any[]) => any)[]} */
      const rememberedFunctions = [];
      port.onmessage = async (e) => {
        /** @type {SharedArrayBuffer} */
        const lockBuffer = e.data[0];
        /** @type {string | number} */
        const executorURLOrId = e.data[1];
        /** @type {any[]} */
        const args = e.data[2];
        const lock = new Int32Array(lockBuffer);

        /** @type {[any] | [void, any]} */
        let r;
        try {
          /** @type {((...a: any[]) => any)} */
          let f;
          if (typeof executorURLOrId === "number") {
            f = rememberedFunctions[executorURLOrId];
          } else {
            const module = await import(executorURLOrId);
            f = await module.default;
            rememberedFunctions.push(f);
          }
          r = [await f(...args)];
        } catch (e) {
          r = [, e];
        }

        port.postMessage(r);
        Atomics.store(lock, 0, 1);
        Atomics.notify(lock, 0);
      };
    });
    const worker = new NodeWorker(`import(${JSON.stringify(u)})`, {
      eval: true,
      name: "redlet",
      workerData: { port: port2 },
      // @ts-ignore
      transferList: [port2],
    });
    worker.unref();
    getPort.c = { worker, port: port1 };
  }
  return getPort.c.port;
}
/** @type {{ worker: NodeWorker, port: MessagePort } | null | undefined} */
getPort.c;

/** @type {string[]} */
const rememberedURLs = [];

/**
 * @template {any[]} A
 * @template R
 * @param {((...args: A) => R) | string | URL} functionOrURL
 * @returns {(...args: A) => Awaited<R>}
 */
function redlet(functionOrURL) {
  /** @type {string} */
  let executorURL;
  /** @type {((...args: A) => R) | null | undefined} */
  let maybeFunction;
  if (typeof functionOrURL === "function") {
    maybeFunction = functionOrURL;
    const code = `export default ${functionOrURL}`;
    executorURL =
      "data:text/javascript;base64," + Buffer.from(code).toString("base64");
  } else if (URLCanParse(functionOrURL)) {
    executorURL = `${functionOrURL}`;
  } else {
    const code = `export default ${functionOrURL}`;
    executorURL =
      "data:text/javascript;base64," + Buffer.from(code).toString("base64");
  }

  /**
   * @param  {A} args
   * @returns {Awaited<R>}
   */
  function run(...args) {
    const port = getPort();

    const lockBuffer = new SharedArrayBuffer(4);
    const lock = new Int32Array(lockBuffer);
    if (rememberedURLs.includes(executorURL)) {
      port.postMessage([lockBuffer, rememberedURLs.indexOf(executorURL), args]);
    } else {
      port.postMessage([lockBuffer, executorURL, args]);
      rememberedURLs.push(executorURL);
    }
    Atomics.wait(lock, 0, 0);

    /** @type {[any] | [void, any]} */
    // @ts-ignore
    const r = receiveMessageOnPort(port).message;
    if (r.length === 1) {
      return r[0];
    } else {
      throw r[1];
    }
  }

  return run;
}

export default redlet;
