import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const port = Number(process.argv[2] || 8767);
const fixtures = new Map([
  ["/client-paywall.html", ["tests/fixtures/client-paywall.html", "text/html; charset=utf-8"]],
  ["/media-article.html", ["tests/fixtures/media-article.html", "text/html; charset=utf-8"]],
  ["/store-article.html", ["tests/fixtures/store-article.html", "text/html; charset=utf-8"]],
  ["/store-reading.svg", ["tests/fixtures/store-reading.svg", "image/svg+xml"]],
  ["/library.html", ["library.html", "text/html; charset=utf-8"]],
  ["/library.css", ["library.css", "text/css; charset=utf-8"]],
  ["/library.js", ["library.js", "text/javascript; charset=utf-8"]],
  ["/print.css", ["print.css", "text/css; charset=utf-8"]],
  ["/saved.html", ["saved.html", "text/html; charset=utf-8"]],
  ["/reader.js", ["reader.js", "text/javascript; charset=utf-8"]],
  ["/vendor/Readability.js", ["vendor/Readability.js", "text/javascript; charset=utf-8"]],
  ["/vendor/purify.min.js", ["vendor/purify.min.js", "text/javascript; charset=utf-8"]],
  ["/icons/icon-128-store.png", ["icons/icon-128-store.png", "image/png"]],
  ["/kokoro.web.js", ["vendor/kokoro.web.js", "text/javascript; charset=utf-8"]],
  ["/ort-wasm-simd-threaded.jsep.mjs", ["vendor/ort-wasm-simd-threaded.jsep.mjs", "text/javascript; charset=utf-8"]],
  ["/ort-wasm-simd-threaded.jsep.wasm", ["vendor/ort-wasm-simd-threaded.jsep.wasm", "application/wasm"]]
]);

const server = createServer(async (request, response) => {
  const fixture = fixtures.get(new URL(request.url, `http://${request.headers.host}`).pathname);
  if (!fixture) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  const [path, contentType] = fixture;
  response.writeHead(200, {
    "content-type": contentType,
    "cache-control": "no-store"
  });
  response.end(await readFile(resolve(path)));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Fixture server listening on http://127.0.0.1:${port}/client-paywall.html`);
});
