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

if (bundle.includes("Unable to determine content-length from response headers")) {
  throw new Error("Kokoro still emits a harmless missing Content-Length warning as an extension error");
}

if (!bundle.includes("set logLevel(e){Wg.backends.onnx.logLevel=e}")) {
  throw new Error("Kokoro does not expose ONNX Runtime's log-level control");
}

for (const resource of [
  "vendor/kokoro.web.js",
  "vendor/ort-wasm-simd-threaded.jsep.mjs",
  "vendor/ort-wasm-simd-threaded.jsep.wasm"
]) {
  if (!resources.includes(resource)) throw new Error(`Missing web-accessible natural voice runtime: ${resource}`);
}

console.log("Natural voice runtime: local ONNX assets and Safari-compatible stream reader");
