function URLCanParse(url) {
  try {
    new URL(url);
  } catch {
    return false;
  }
  return true;
}

const controllerCode = `
globalThis.onmessage = async (e) => {
  /** @type {[SharedArrayBuffer, string, any, any[], SharedArrayBuffer]} */
  const [lockBuffer, moduleURL, this_, arguments_, returnValueBuffer] = e.data;
  const lock = new Int32Array(lockBuffer);
  /** @type {[string] | [void, any]} */
  let r;
  try {
    const module = await import(moduleURL);
    r = [await module.default.apply(this_, arguments_)];
  } catch (e) {
    r = [, e];
  }
  let rJSON;
  try {
    rJSON = JSON.stringify(r);
  } catch {
    rJSON = '[null,"<unserializable>"]';
  }
  const returnValueBytes = new TextEncoder().encode(rJSON);
  returnValueBuffer.grow(returnValueBytes.byteLength);
  new Uint8Array(returnValueBuffer).set(returnValueBytes);
  Atomics.store(lock, 0, 1);
  Atomics.notify(lock, 0);
};
`;

/** @type {{ worker: Worker } | null | undefined} */
let cache;

/** @returns {Worker} */
function getWorker() {
  if (!cache) {
    const u = URL.createObjectURL(
      new Blob([controllerCode], { type: "text/javascript" })
    );
    const worker = new Worker(u, { name: "redlet", type: "module" });
    cache = { worker };
  }
  return cache.worker;
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

  const { run } = {
    run() {
      const lockBuffer = new SharedArrayBuffer(4);
      const lock = new Int32Array(lockBuffer);
      const returnValueBuffer = new SharedArrayBuffer(0, {
        maxByteLength: 64 * 1024,
      });
      const worker = getWorker();
      worker.postMessage([
        lockBuffer,
        executorURL,
        this,
        [...arguments],
        returnValueBuffer,
      ]);
      Atomics.wait(lock, 0, 0);
      const rJSON = new TextDecoder().decode(returnValueBuffer);
      const r = JSON.parse(rJSON);
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
      Object.getOwnPropertyDescriptors(maybeFunction)
    );
  }

  return run;
}

export default redlet;
