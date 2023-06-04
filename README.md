![🚧 Under construction 👷‍♂️](https://i.imgur.com/LEP2R3N.png)

# tinythreadlet

🎨 `redlet()`, `greenlet()`, `bluelet()`, and more threading helpers for web
`Worker`s

<div align="center">

![](https://picsum.photos/600/400)

[⚡ StackBlitz demo](https://stackblitz.com/) |
[Docs website](https://tinylibs.github.io/tinythreadlet/)

</div>

⏱ Run an `async` function synchronously with `redlet()` \
🏃‍♂️ Offload a heavy function to a `Worker` with `greenlet()` \
🌳 Fully tree-shakable

## Installation

![npm](https://img.shields.io/static/v1?style=for-the-badge&message=npm&color=CB3837&logo=npm&logoColor=FFFFFF&label=)
![Yarn](https://img.shields.io/static/v1?style=for-the-badge&message=Yarn&color=2C8EBB&logo=Yarn&logoColor=FFFFFF&label=)
![pnpm](https://img.shields.io/static/v1?style=for-the-badge&message=pnpm&color=FF6C37&logo=pnpm&logoColor=FFFFFF&label=)
![jsDelivr](https://img.shields.io/static/v1?style=for-the-badge&message=jsDelivr&color=E84D3D&logo=jsDelivr&logoColor=FFFFFF&label=)

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

![Node.js](https://img.shields.io/static/v1?style=for-the-badge&message=Node.js&color=339933&logo=Node.js&logoColor=FFFFFF&label=)
![Deno](https://img.shields.io/static/v1?style=for-the-badge&message=Deno&color=000000&logo=Deno&logoColor=FFFFFF&label=)
![Browser](https://img.shields.io/static/v1?style=for-the-badge&message=Browser&color=4285F4&logo=Google+Chrome&logoColor=FFFFFF&label=)

[📚 Find more examples and docs on the documentation website!](https://tinylibs.github.io/tinythreadlet/)

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

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/___YOUR_PATH___)

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

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/___YOUR_PATH___)

⚠️ `redlet()` only works in browsers if you have [enabled `SharedArrayBuffer`],
and even then only if it's run _not_ on the main `window` thread.

✅ `redlet()` will always work in Node.js and other server-side environments
like Deno. Those contexts all enable `SharedArrayBuffer` by default, and support
`Atomics.wait()` on the main thread! 🎉

## Development

![TypeScript](https://img.shields.io/static/v1?style=for-the-badge&message=TypeScript&color=3178C6&logo=TypeScript&logoColor=FFFFFF&label=)
![Node.js](https://img.shields.io/static/v1?style=for-the-badge&message=Node.js&color=339933&logo=Node.js&logoColor=FFFFFF&label=)

TODO: Add development blurb

<!-- prettier-ignore-start -->
[enabled `SharedArrayBuffer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
[Yarn]: https://yarnpkg.com/
[pnpm]: https://pnpm.io/
[Deno]: https://deno.land/
[ESM>CDN]: https://esm.sh/
[jsDelivr]: https://www.jsdelivr.com/esm
[Deno's new `npm:` specifier]: https://deno.com/manual/node/npm_specifiers
<!-- prettier-ignore-end -->
