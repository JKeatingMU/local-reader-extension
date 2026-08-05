import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const port = Number(process.argv[2] || 9333);
const fixtureUrl = process.argv[3];
if (!fixtureUrl) {
  throw new Error("Usage: node tests/chrome-smoke-test.mjs <debug-port> <fixture-url>");
}

const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
const page = targets.find((target) => target.type === "page");
if (!page) throw new Error("No Chrome page target found");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolveSocket, rejectSocket) => {
  socket.addEventListener("open", resolveSocket, { once: true });
  socket.addEventListener("error", rejectSocket, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve: resolveCall, reject: rejectCall } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) rejectCall(new Error(message.error.message));
  else resolveCall(message.result);
});

function call(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolveCall, rejectCall) => {
    pending.set(id, { resolve: resolveCall, reject: rejectCall });
  });
}

await call("Page.enable");
await call("Runtime.enable");
await call("Page.navigate", { url: fixtureUrl });
await new Promise((resolveWait) => setTimeout(resolveWait, 1200));

const readerSource = await readFile(resolve("reader.js"), "utf8");
const injection = await call("Runtime.evaluate", {
  expression: readerSource,
  awaitPromise: true,
  returnByValue: true
});
if (injection.exceptionDetails) {
  throw new Error(injection.exceptionDetails.exception?.description || "Reader injection failed");
}

await new Promise((resolveWait) => setTimeout(resolveWait, 300));
const inspection = await call("Runtime.evaluate", {
  expression: `JSON.stringify({
    reader: Boolean(document.querySelector('#dm-reader-view')),
    title: document.querySelector('h1')?.textContent?.trim(),
    paragraphs: document.querySelectorAll('#dm-content > p').length,
    figures: document.querySelectorAll('#dm-content > figure').length,
    controls: document.querySelectorAll('.dm-toolbar button').length,
    firstParagraph: document.querySelector('#dm-content > p')?.textContent?.trim(),
    lastParagraph: [...document.querySelectorAll('#dm-content > p')].at(-1)?.textContent?.trim(),
    containsProductCta: document.querySelector('#dm-content')?.textContent?.includes('Shop')
  })`,
  returnByValue: true
});
const result = JSON.parse(inspection.result.value);

const screenshot = await call("Page.captureScreenshot", { format: "png" });
const screenshotPath = "/private/tmp/dailymail-reader-smoke.png";
await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));

console.log(JSON.stringify({ ...result, screenshotPath }, null, 2));

if (
  !result.reader ||
  result.paragraphs < 30 ||
  result.controls !== 5 ||
  result.containsProductCta ||
  !result.firstParagraph?.startsWith("They’re everywhere.") ||
  !result.lastParagraph?.endsWith("rolled-up newspaper.")
) {
  process.exitCode = 1;
}

socket.close();
