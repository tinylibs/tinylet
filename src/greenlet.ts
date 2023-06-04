export default function greenlet(f: any): any {
  return async (...args: any[]) => f(...args);
}
