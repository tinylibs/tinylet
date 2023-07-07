/**
 * @param {string | URL} url
 * @returns {boolean}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/URL/canParse_static
 */
// This is so tiny that it's not worth the additional "does this already exist?
// If not, import() it" logic.
export default function URLCanParse(url) {
  try {
    new URL(url);
  } catch {
    return false;
  }
  return true;
}
