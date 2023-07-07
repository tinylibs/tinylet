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
      port.onmessage = async (e) => {
        const [lockBuffer, moduleURL, that, args] = e.data;
        const lock = new Int32Array(lockBuffer);
        /** @type {[any] | [void, any]} */
        let r;
        try {
          const module = await import(moduleURL);
          r = [await module.default.apply(that, args)];
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
    executorURL =
      "data:text/javascript;base64," + Buffer.from(code).toString("base64");
  } else if (URLCanParse(functionOrURL)) {
    executorURL = functionOrURL;
  } else {
    const code = `export default ${functionOrURL}`;
    executorURL =
      "data:text/javascript;base64," + Buffer.from(code).toString("base64");
  }

  function run() {
    const lockBuffer = new SharedArrayBuffer(4);
    const lock = new Int32Array(lockBuffer);
    const port = getPort();
    port.postMessage([lockBuffer, executorURL, this, [...arguments]]);
    Atomics.wait(lock, 0, 0);
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
