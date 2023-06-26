// @ts-nocheck
const executorURL = TEMPLATE_EXECUTOR_URL;

/**
 * @param {EventTarget} eventTarget
 * @param {string} type
 * @returns {Promise<Event>}
 */
export async function pEvent(eventTarget, type) {
  return await new Promise((resolve, reject) => {
    const controller = new AbortController();
    const { signal } = controller;
    const id = setTimeout(() => controller.abort(), 10000);
    signal.addEventListener("abort", () => clearTimeout(id));

    eventTarget.addEventListener(
      type,
      (event) => {
        resolve(event);
        controller.abort();
      },
      { signal }
    );
    eventTarget.addEventListener(
      "error",
      (event) => {
        reject(event);
        controller.abort();
      },
      { signal }
    );
  });
}

function isTransferable(value) {
  return false;
}

function getTransferList(data) {
  const transferList = [];
  const seen = new WeakSet();
  const queue = [data];
  while (queue.length) {
    const item = queue.pop();
    if (isTransferable(item)) {
      if (seen.has(item)) {
        throw new DOMException(
          "Only one copy of an object can be transferred",
          "DataCloneError"
        );
      } else {
        transferList.push(item);
        seen.add(item);
      }
    } else if (item && typeof item === "object") {
      for (const value of Object.values(item)) {
        queue.push(value);
      }
    }
  }
  return transferList;
}

/** @type {object | null | undefined} */
let executorModule;
globalThis.addEventListener("message", async (event) => {
  executorModule ??= await import(executorURL);
  const { data } = event;
  const [this_, ...arguments_] = data;
  const returnValue = await executorModule.default.call(this_, ...arguments_);
  globalThis.postMessage(returnValue, getTransferList(returnValue));
});
