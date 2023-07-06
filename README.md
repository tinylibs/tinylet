![🚧 Under construction 👷‍♂️](https://i.imgur.com/LEP2R3N.png)

# tinylet

🎨 `redlet()` and `greenlet()` threading helpers for Node.js, Deno, and the
browser

<div align="center">

![](https://i.imgur.com/8iLUDzC.png)

</div>

⏱ Run an `async` function synchronously with `redlet()` \
🏃‍♂️ Offload a heavy function to a `Worker` with `greenlet()` \
🌳 Fully tree-shakable \
🦕 Supports Deno! \
💻 Works in the browser \
⚠️ `redlet()` requires [enabling `SharedArrayBuffer`] in the browser

## Installation

![npm](https://img.shields.io/static/v1?style=for-the-badge&message=npm&color=CB3837&logo=npm&logoColor=FFFFFF&label=)
![Yarn](https://img.shields.io/static/v1?style=for-the-badge&message=Yarn&color=2C8EBB&logo=Yarn&logoColor=FFFFFF&label=)
![pnpm](https://img.shields.io/static/v1?style=for-the-badge&message=pnpm&color=FF6C37&logo=pnpm&logoColor=FFFFFF&label=)
![jsDelivr](https://img.shields.io/static/v1?style=for-the-badge&message=jsDelivr&color=E84D3D&logo=jsDelivr&logoColor=FFFFFF&label=)

You can install this package using npm, [Yarn], or [pnpm]:

```sh
npm install tinylet
```

If you're using [Deno], you can import this package from an npm CDN like
[ESM>CDN] or [jsDelivr]. You can also use [Deno's new `npm:` specifier] to
import this package directly from npm!

```ts
import {} from "https://esm.run/tinylet";
import {} from "npm:tinylet";
```

If you're in the browser using a `<script type="module">` tag, you can import
this package straight from an npm CDN like [ESM>CDN] or [jsDelivr]!

```html
<script type="module">
  import {} from "https://esm.run/tinylet";
</script>
```

## Usage

![Node.js](https://img.shields.io/static/v1?style=for-the-badge&message=Node.js&color=339933&logo=Node.js&logoColor=FFFFFF&label=)
![Deno](https://img.shields.io/static/v1?style=for-the-badge&message=Deno&color=000000&logo=Deno&logoColor=FFFFFF&label=)
![Browser](https://img.shields.io/static/v1?style=for-the-badge&message=Browser&color=4285F4&logo=Google+Chrome&logoColor=FFFFFF&label=)

[📚 Find more examples and docs on the documentation website!](https://tinylibs.github.io/tinylet/)

You can use `greenlet()` to run a function _asynchronously_ in a web worker!
This is great for offloading complicated synchronous work (like image
processing) to a web worker so that it doesn't block the main thread.

```js
import { greenlet } from "tinylet";

// Runs asynchronously in a worker thread.
const f = greenlet((a, b) => {
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
console.log(await f(1, 200));
//=> -2066010092.990183
```

If you want to go the other way and run an `async` function in a worker thread,
but still get the result back _synchronously_ in the current thread, you can use
`redlet()`! This is useful when you absolutely _need_ something to be
synchronous (like for WASM interop) but the underlying web API is asynchronous.

```js
import { redlet } from "tinylet";

// Runs in a worker thread and uses Atomics.wait() to block the current thread.
const f = redlet(async (u) => {
  const response = await fetch(u);
  return await response.json();
});
// Takes 1 second to run and BLOCKS the current thread!
console.log(f("https://jsonplaceholder.typicode.com/todos/1"));
//=> { "userId": 1, "id": 1, "title": "delectus aut autem", "completed": false }
```

⚠️ `redlet()` works in browsers, only if you've [enabled `SharedArrayBuffer`].
Even then, you can't call `redlet()` on the main thread; it only works in worker
threads. This is because browsers don't allow `Atomics.wait()` to be called on
the main thread.

✅ `redlet()` will always work in Node.js and other server-side environments
like Deno. Those contexts all enable `SharedArrayBuffer` by default, and support
`Atomics.wait()` on the main thread! 🎉

## Development

TODO: Add development blurb

<!-- prettier-ignore-start -->
[enabled `SharedArrayBuffer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
[enabling `SharedArrayBuffer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
[Yarn]: https://yarnpkg.com/
[pnpm]: https://pnpm.io/
[Deno]: https://deno.land/
[ESM>CDN]: https://esm.sh/
[jsDelivr]: https://www.jsdelivr.com/esm
[Deno's new `npm:` specifier]: https://deno.com/manual/node/npm_specifiers
<!-- prettier-ignore-end -->
