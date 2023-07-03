import Worker from "./internal/Worker-node.js";
import createContentURL from "./internal/createContentURL-node.js";

function isValidURL(url) {
  try {
    new URL(url);
  } catch (error) {
    return false;
  }
  return true;
}

const controllerContentURL = createContentURL(
  `
    globalThis.addEventListener("message", async ({ data }) => {
      if (data?.type === "run") {
        const { channel, executorURL, this: that, arguments: args } = data;
        let result;
        try {
          const { default: executor } = await import(executorURL);
          result = await executor.apply(that, args);
        } catch (error) {
          postMessage({ type: "reject", channel, error });
        }
        postMessage({ type: "resolve", channel, result });
      }
    });
  `,
  "text/javascript"
);

const fr = new FinalizationRegistry((worker) => worker.terminate());

function greenlet(functionOrURL) {
  let executorURL;
  let maybeFunction;
  if (typeof functionOrURL === "function") {
    maybeFunction = functionOrURL;
    executorURL = createContentURL(
      `export default ${functionOrURL}`,
      "text/javascript"
    );
  } else if (isValidURL(functionOrURL)) {
    executorURL = functionOrURL;
  } else {
    executorURL = createContentURL(
      `export default ${functionOrURL}`,
      "text/javascript"
    );
  }

  let worker;
  let id;
  function getWorker() {
    if (!worker) {
      worker = new Worker(controllerContentURL, { type: "module" });
      fr.register(run, worker);
    }
    return worker;
  }

  async function run(...args) {
    id = clearTimeout(id);
    const worker = getWorker();
    const channel = Math.random().toString();
    const data = {
      type: "run",
      channel,
      this: this,
      arguments: args,
      executorURL,
    };
    worker.postMessage(data);
    const p = new Promise((resolve, reject) => {
      worker.addEventListener("message", function f({ data }) {
        if (data?.channel !== channel) return;
        if (data?.type === "resolve") {
          resolve(data.result);
          worker.removeEventListener("message", f);
        } else if (data?.type === "reject") {
          reject(data.error);
          worker.removeEventListener("message", f);
        }
      });
    });
    const res = await p;
    id ??= setTimeout(() => worker.terminate(), 1000);
    return res;
  }
  if (typeof maybeFunction === "function") {
    Object.defineProperties(
      run,
      Object.getOwnPropertyDescriptors(maybeFunction)
    );
  }

  return run;
}

export default greenlet;
