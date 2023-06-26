#!/usr/bin/env node
import fsPromises from "node:fs/promises";
import { minify } from "terser";

for (const templateFile of [
  "src/internal/greenlet-controller.js",
  "src/internal/greenlet-controller-node.js",
]) {
  const outFile = templateFile.replace(/\.js$/, ".txt.js");
  const templateText = await fsPromises.readFile(templateFile, "utf8");

  const reserved = [
    ...new Set([
      ...[...templateText.matchAll(/\W(__\w+)\W/g)].map((m) => m[1]),
      ...[...templateText.matchAll(/\W(TEMPLATE_\w+)\W/g)].map((m) => m[1]),
    ]),
  ].sort();
  console.debug("reserved: %O", reserved);

  const terserOptions = {
    module: true,
    compress: { unused: false },
    mangle: { reserved },
  };
  const terserResult = await minify(templateText, terserOptions);
  const minifiedTemplateText = terserResult.code;

  const outText = `export default ${JSON.stringify(minifiedTemplateText)};`;
  await fsPromises.writeFile(outFile, outText);
  console.debug("Wrote %s to %s", minifiedTemplateText.length, outFile);
}
