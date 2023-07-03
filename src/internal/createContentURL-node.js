export default function createContentURL(data, type) {
  return `data:${type},${encodeURIComponent(data)}`;
}
