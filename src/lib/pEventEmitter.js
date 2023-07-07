/**
 * @template R
 * @param {import("node:events").EventEmitter} eventEmitter
 * @param {string} type
 * @param {(x: R) => boolean} [filter]
 * @returns {Promise<R>}
 */
export default function pEventEmitter(eventEmitter, type, filter = () => true) {
  return new Promise((resolve, reject) => {
    function abort() {
      eventEmitter.off(type, handleType);
      eventEmitter.off("error", handleError);
    };
    function handleType(x) {
      if (filter(x)) {
        resolve(x);
        abort();
      }
    };
    function handleError(e) {
      reject(e);
      abort();
    }
    eventEmitter.on(type, handleType);
    eventEmitter.on("error", handleError);
  });
}
