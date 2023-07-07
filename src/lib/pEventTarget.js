/**
 * @template {Event} E
 * @param {EventTarget} eventTarget
 * @param {string} type
 * @param {(x: E) => boolean} [filter]
 * @returns {Promise<E>}
 */
export default function pEventTarget(eventTarget, type, filter = () => true) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const { signal } = controller;
    eventTarget.addEventListener(
      type,
      /** @param {E} e */
      (e) => {
        if (filter(e)) {
          resolve(e);
          controller.abort();
        }
      },
      { signal },
    );
    eventTarget.addEventListener(
      "error",
      (e) => {
        // @ts-ignore
        reject(e.error ?? e);
        controller.abort();
      },
      { signal },
    );
  });
}
