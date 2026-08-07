import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const bundle = await readFile(resolve("vendor/kokoro.web.js"), "utf8");
const manifest = JSON.parse(await readFile(resolve("manifest.json"), "utf8"));
const resources = manifest.web_accessible_resources?.flatMap(({ resources = [] }) => resources) || [];

if (bundle.includes("for await(const e of A)t.push(e)")) {
  throw new Error("Kokoro still uses ReadableStream async iteration, which Safari 26 does not expose");
}

if (!bundle.includes("new Response(A).arrayBuffer()")) {
  throw new Error("Kokoro is missing Safari-compatible pronunciation-dictionary stream consumption");
}

for (const resource of [
  "vendor/kokoro.web.js",
  "vendor/ort-wasm-simd-threaded.jsep.mjs",
  "vendor/ort-wasm-simd-threaded.jsep.wasm"
]) {
  if (!resources.includes(resource)) throw new Error(`Missing web-accessible natural voice runtime: ${resource}`);
}

console.log("Natural voice runtime: local ONNX assets and Safari-compatible stream reader");
