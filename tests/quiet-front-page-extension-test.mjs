const port = Number(process.argv[2] || 9357);
const fixtureUrl = process.argv[3];

if (!fixtureUrl) {
  throw new Error("Usage: node tests/quiet-front-page-extension-test.mjs <debug-port> <fixture-url>");
}

const pageTarget = await waitForTarget((target) => target.type === "page");
const page = await connect(pageTarget);
await page.call("Page.enable");
await page.call("Runtime.enable");
await page.call("Page.navigate", { url: fixtureUrl });
await new Promise((resolveWait) => setTimeout(resolveWait, 500));

await page.call("Input.dispatchKeyEvent", {
  type: "rawKeyDown", key: "F", code: "KeyF", windowsVirtualKeyCode: 70, nativeVirtualKeyCode: 3, modifiers: 9
});
await page.call("Input.dispatchKeyEvent", {
  type: "keyUp", key: "F", code: "KeyF", windowsVirtualKeyCode: 70, nativeVirtualKeyCode: 3, modifiers: 9
});
// The shortcut wakes Manifest V3's event-driven service worker, so inspect the
// extension identity only after activation rather than relying on an idle worker.
const { worker, identity } = await waitForExtensionWorker("Quiet Front Page — Clean News Homepages");
await new Promise((resolveWait) => setTimeout(resolveWait, 500));
const inspectionResult = await page.call("Runtime.evaluate", {
  expression: `(() => {
    const root = document.querySelector('#textuary-quiet-front-page');
    const quiet = root?.shadowRoot;
    return {
      root: Boolean(root && quiet),
      stories: quiet?.querySelectorAll('.qfp-story').length || 0,
      eyebrow: quiet?.querySelector('.qfp-eyebrow')?.textContent.trim() || '',
      originalButton: quiet?.getElementById('qfp-original')?.textContent.trim() || '',
      links: [...(quiet?.querySelectorAll('.qfp-story h2 a') || [])].map((link) => link.href)
    };
  })()`,
  returnByValue: true
});
const inspection = inspectionResult.result.value;

assert(identity.name === "Quiet Front Page — Clean News Homepages", "staged extension name is incorrect");
assert(identity.version === "1.0.0", "staged extension version is incorrect");
assert(JSON.stringify([...identity.permissions].sort()) === JSON.stringify(["activeTab", "scripting"]), "staged permissions changed");
assert(inspection.root, "the packaged QFP view was not rendered");
assert(inspection.stories === 6, `expected 6 packaged fixture stories, found ${inspection.stories}`);
assert(inspection.eyebrow === "QUIET FRONT PAGE", "the standalone QFP identity was not rendered");
assert(inspection.originalButton === "← Original page", "the packaged navigation control is missing");
assert(inspection.links.length === 6 && inspection.links.every((url) => new URL(url).hostname === "127.0.0.1"), "packaged story links are invalid");

console.log(JSON.stringify({ identity, ...inspection }, null, 2));
page.close();
worker.close();

async function waitForTarget(predicate) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
    const target = targets.find(predicate);
    if (target) return target;
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error("Required Chrome target was not found");
}

async function waitForExtensionWorker(expectedName) {
  const seenNames = new Set();
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
    for (const target of targets.filter((candidate) => candidate.type === "service_worker" && /background\.js(?:$|\?)/.test(candidate.url))) {
      const candidate = await connect(target);
      await candidate.call("Runtime.enable");
      const result = await candidate.call("Runtime.evaluate", {
        expression: `(() => {
          const manifest = chrome.runtime.getManifest();
          return { name: manifest.name, version: manifest.version, permissions: manifest.permissions };
        })()`,
        returnByValue: true
      });
      const identity = result.result?.value;
      if (identity?.name) seenNames.add(identity.name);
      if (identity?.name === expectedName) return { worker: candidate, identity };
      candidate.close();
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`Extension worker was not found for ${expectedName}; saw: ${[...seenNames].join(", ") || "none"}`);
}

async function connect(target) {
  const socket = new WebSocket(target.webSocketDebuggerUrl);
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
  return {
    call(method, params = {}) {
      const id = ++sequence;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolveCall, rejectCall) => pending.set(id, { resolve: resolveCall, reject: rejectCall }));
    },
    close() {
      socket.close();
    }
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
