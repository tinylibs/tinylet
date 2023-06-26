import controllerURL from "#/internal/greenlet-controller.txt.js";

function isValidURL(url) {
  try {
    new URL(url);
  } catch (error) {
    return false;
  }
  return true;
}

const fr = new FinalizationRegistry((worker: Worker) => worker.terminate());

function greenlet(function_);
function greenlet(url);
function greenlet(functionOrURL) {
  let executorURL: string;
  let maybeFunction: Function | null | undefined;
  if (typeof functionOrURL !== "function" && isValidURL(functionOrURL)) {
    executorURL = functionOrURL;
  } else {
    maybeFunction = functionOrURL;
    executorURL =
      "data:text/javascript," +
      encodeURIComponent(`export default ${functionOrURL};`);
  }

  let worker: Worker | null | undefined;
  function getWorker(): Worker {
    if (!worker) {
      worker = new Worker(controllerURL, { type: "module" });
      fr.register(run, worker);
    }
    return worker;
  }

  async function run(...args: any[]): Promise<unknown> {
    const worker = getWorker();
    const data = [this, ...args];
    worker.postMessage(data, getTransferList(data));
    const event = await pEvent(worker, "message");
    return event.data;
  }
  if (typeof maybeFunction === "function") {
    Object.defineProperty(run, "name", { value: maybeFunction.name });
    Object.defineProperty(run, "length", { value: maybeFunction.length });
  }

  return run;
}

export default greenlet;
