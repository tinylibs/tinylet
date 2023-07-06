import {
  Worker as NodeWorker,
  receiveMessageOnPort,
} from "node:worker_threads";

function URLCanParse(url) {
  try {
    new URL(url);
  } catch {
    return false;
  }
  return true;
}

const controllerCode = `
import { workerData } from "node:worker_threads";

const port = workerData.port;
port.onmessage = async (e) => {
  const [lockBuffer, moduleURL, this_, arguments_] = e.data;
  const lock = new Int32Array(lockBuffer);
  /** @type {[string] | [void, any]} */
  let r;
  try {
    const module = await import(moduleURL);
    r = [await module.default.apply(this_, arguments_)];
  } catch (e) {
    r = [, e];
  }
  port.postMessage(r);
  Atomics.store(lock, 0, 1);
  Atomics.notify(lock, 0);
};
`;

/** @type {{ worker: NodeWorker, port: MessagePort } | null | undefined} */
let cache;

/** @returns {MessagePort} */
function getPort() {
  if (!cache) {
    const { port1, port2 } = new MessageChannel();
    port1.unref();
    port2.unref();
    const u =
      "data:text/javascript;base64," +
      Buffer.from(controllerCode).toString("base64");
    const worker = new NodeWorker(`import(${JSON.stringify(u)})`, {
      eval: true,
      name: "redlet",
      workerData: { port: port2 },
      transferList: [port2],
    });
    worker.unref();
    cache = { worker, port: port1 };
  }
  return cache.port;
}

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

  const { run } = {
    run() {
      const lockBuffer = new SharedArrayBuffer(4);
      const lock = new Int32Array(lockBuffer);
      const port = getPort();
      port.postMessage([lockBuffer, executorURL, this, [...arguments]]);
      Atomics.wait(lock, 0, 0);
      const r = receiveMessageOnPort(port).message;
      if (r.length === 1) {
        return r[0];
      } else {
        throw r[1];
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

export default redlet;
