import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const vendor = resolve(root, "vendor");
await mkdir(vendor, { recursive: true });

const readabilitySource = resolve(root, "node_modules/@mozilla/readability/Readability.js");
const purifySource = resolve(root, "node_modules/dompurify/dist/purify.min.js");
const kokoroSource = resolve(root, "node_modules/kokoro-js/dist/kokoro.web.js");
const onnxRuntimeSource = resolve(root, "node_modules/@huggingface/transformers/dist");

const readability = await readFile(readabilitySource, "utf8");
const purify = await readFile(purifySource, "utf8");
const kokoro = await readFile(kokoroSource, "utf8");
const asyncStreamIteration = "t=[];for await(const e of A)t.push(e);const r=await new Blob(t).arrayBuffer();";
const responseStreamConsumption = "r=await new Response(A).arrayBuffer();";
const safariCompatibleKokoro = kokoro.replace(asyncStreamIteration, responseStreamConsumption);

if (safariCompatibleKokoro === kokoro) {
  throw new Error("Could not apply the Safari ReadableStream compatibility patch to Kokoro.js");
}

await writeFile(
  resolve(vendor, "Readability.js"),
  `/* @mozilla/readability 0.6.0 — Apache-2.0 */\n${readability}`
);
await writeFile(
  resolve(vendor, "purify.min.js"),
  `/* DOMPurify 3.4.13 — MPL-2.0 OR Apache-2.0 */\n${purify}`
);

await copyFile(
  resolve(root, "node_modules/@mozilla/readability/LICENSE.md"),
  resolve(vendor, "LICENSE-readability.md")
);
await copyFile(
  resolve(root, "node_modules/dompurify/LICENSE"),
  resolve(vendor, "LICENSE-dompurify.txt")
);
await writeFile(resolve(vendor, "kokoro.web.js"), safariCompatibleKokoro);
await copyFile(
  resolve(onnxRuntimeSource, "ort-wasm-simd-threaded.jsep.mjs"),
  resolve(vendor, "ort-wasm-simd-threaded.jsep.mjs")
);
await copyFile(
  resolve(onnxRuntimeSource, "ort-wasm-simd-threaded.jsep.wasm"),
  resolve(vendor, "ort-wasm-simd-threaded.jsep.wasm")
);
await copyFile(
  resolve(root, "node_modules/kokoro-js/LICENSE"),
  resolve(vendor, "LICENSE-kokoro-js.txt")
);
await copyFile(
  resolve(root, "node_modules/@huggingface/transformers/LICENSE"),
  resolve(vendor, "LICENSE-transformers-js.txt")
);
await copyFile(
  resolve(root, "node_modules/phonemizer/LICENSE"),
  resolve(vendor, "LICENSE-phonemizer.txt")
);
await writeFile(
  resolve(vendor, "LICENSE-onnxruntime.txt"),
  `MIT License

Copyright (c) Microsoft Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`
);

console.log("Vendored Readability 0.6.0, DOMPurify 3.4.13, Kokoro.js 1.2.1 and its ONNX runtime");
