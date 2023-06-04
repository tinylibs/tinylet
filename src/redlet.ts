export default function redlet(f: any): any {
  return (...args: any[]) => f(...args);
}
