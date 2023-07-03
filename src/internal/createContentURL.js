export default function createContentURL(data, type) {
  return URL.createObjectURL(new Blob([data], { type }));
}
