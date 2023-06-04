# tinythreadlet

🎨 `redlet()`, `greenlet()`, `bluelet()`, and more threading helpers for web
`Worker`s

<div align="center">

</div>

⏱ Run an `async` function synchronously with `redlet()` \
🏃‍♂️ Offload a heavy function to a `Worker` with `greenlet()` \
🌳 Fully tree-shakable

## Installation

You can install this package using npm, [Yarn], or [pnpm]:

```sh
npm install tinythreadlet
```

If you're using [Deno], you can import this package from an npm CDN like
[ESM>CDN] or [jsDelivr]. You can also use [Deno's new `npm:` specifier] to
import this package directly from npm!

```ts
import {} from "https://esm.sh/tinythreadlet";
import {} from "npm:tinythreadlet";
```

If you're in the browser using a `<script type="module">` tag, you can import
this package straight from an npm CDN like [ESM>CDN] or [jsDelivr]!

```html
<script type="module">
  import {} from "https://esm.sh/tinythreadlet";
</script>
```

## Usage

You can use `greenlet()` to run a function _asynchronously_ in a web worker!
This is great for offloading complicated synchronous work (like image
processing) to a web worker so that it doesn't block the main thread.

```js
import { greenlet } from "tinythreadlet";

// Runs asynchronously in a worker thread.
const green = greenlet((a, b) => {
  let n = 0;
  for (let i = 0; i < 1000000000; i++) {
    if (i % 5 === 0) n += a;
    if (i % 10 === 0) n -= i;
    if (i % 60 === 0) n *= 2;
    if (i % 75 === 0) n /= b;
  }
  return n;
});
// Takes ~3 seconds to run, but doesn't block the main thread!
console.log(await green(1, 200));
//=> -2066010092.990183
```

If you want to go the other way and run an `async` function in a worker thread,
but still get the result back _synchronously_ in the current thread, you can use
`redlet()`! This is useful when you absolutely _need_ something to be
synchronous (like for WASM interop) but the underlying web API is asynchronous.

```js
import { redlet } from "tinythreadlet";

// Runs in a worker thread and uses Atomics.wait() to block the current thread.
const red = redlet(async (u) => {
  const response = await fetch(u);
  return await response.json();
});
// Takes 1 second to run and BLOCKS the current thread!
console.log(red("https://jsonplaceholder.typicode.com/todos/1"));
//=> { "userId": 1, "id": 1, "title": "delectus aut autem", "completed": false }
```

⚠️ `redlet()` only works in browsers if you have [enabled `SharedArrayBuffer`],
and even then only if it's run _not_ on the main `window` thread.

✅ `redlet()` will always work in Node.js and other server-side environments
like Deno. Those contexts all enable `SharedArrayBuffer` by default, and support
`Atomics.wait()` on the main thread! 🎉
