const port = Number(process.argv[2] || 9333);
const fixtureOrigin = process.argv[3] || "http://127.0.0.1:8767";
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
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function call(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method} did not return within 12 seconds`));
    }, 12_000);
    pending.set(id, {
      resolve(value) { clearTimeout(timer); resolve(value); },
      reject(error) { clearTimeout(timer); reject(error); }
    });
  });
}

const prose = Array.from({ length: 8 }, (_, index) =>
  `<p>Saved paragraph ${index + 1} contains enough carefully preserved article text to validate Textuary’s offline library reader, its complete rendering path, and its remembered reading position across both supported browser modes.</p>`
).join("");
const savedArticle = {
  id: "article-test",
  sourceUrl: "https://example.com/quiet-reading",
  title: "A saved investigation for a quiet afternoon",
  description: "A clean local article snapshot used to validate the Textuary Library.",
  byline: "Alex Reader",
  published: "2026-08-08T10:00:00Z",
  siteName: "Example Gazette",
  content: prose,
  wordCount: 208,
  readingMinutes: 1,
  language: "en-GB",
  savedAt: Date.now() - 60_000,
  updatedAt: Date.now() - 60_000,
  progress: .42,
  speechIndex: 2,
  read: false
};

await call("Page.enable");
await call("Runtime.enable");
await call("Page.addScriptToEvaluateOnNewDocument", {
  source: `(() => {
    const values = {
      textuarySavedArticles: ${JSON.stringify({ version: 1, articles: [savedArticle] })},
      textuaryReadingPreferences: { theme: 'paper', fontFamily: 'editorial', fontSize: 20, lineHeight: 1.72, columnWidth: 1040, speechEngine: 'system', speechVoice: '', speechRate: '1', appleVoice: '', kokoroVoice: 'bf_emma', kokoroConsent: false }
    };
    const storage = { local: {
      async get(key) { return { [key]: values[key] }; },
      async set(next) { Object.assign(values, next); }
    } };
    const runtime = {
      getURL(path) { return ${JSON.stringify(`${fixtureOrigin}/`)} + path; },
      async sendMessage() { return { ok: true }; }
    };
    if (globalThis.chrome) {
      Object.defineProperty(globalThis.chrome, 'storage', { configurable: true, value: storage });
      Object.defineProperty(globalThis.chrome, 'runtime', { configurable: true, value: runtime });
    } else {
      Object.defineProperty(globalThis, 'chrome', { configurable: true, value: { storage, runtime } });
    }
    Object.defineProperty(globalThis, '__textuaryLibraryValues', { configurable: true, value: values });
  })()`
});

await call("Page.navigate", {
  url: `${fixtureOrigin}/library.html?returnTo=article&sourceUrl=${encodeURIComponent("https://example.com/quiet-reading")}&returnProgress=0.42`
});
await new Promise((resolve) => setTimeout(resolve, 700));
const libraryView = await evaluate(`(() => {
  const search = document.querySelector('#library-search');
  search.value = 'afternoon';
  search.dispatchEvent(new Event('input'));
  const visibleAfterMatch = document.querySelectorAll('.article-card').length;
  search.value = 'missing phrase';
  search.dispatchEvent(new Event('input'));
  const visibleAfterMiss = document.querySelectorAll('.article-card').length;
  search.value = '';
  search.dispatchEvent(new Event('input'));
  document.querySelector('.article-state')?.click();
  return JSON.stringify({
    heading: document.querySelector('h1')?.textContent,
    cards: document.querySelectorAll('.article-card').length,
    title: document.querySelector('.article-title')?.textContent,
    count: document.querySelector('#library-count')?.textContent,
    storage: document.querySelector('#library-storage')?.textContent,
    visibleAfterMatch,
    visibleAfterMiss,
    returnVisible: !document.querySelector('#library-return')?.hidden,
    returnLabel: document.querySelector('#library-return')?.textContent
  });
})()`);
await new Promise((resolve) => setTimeout(resolve, 100));
const libraryState = await evaluate(`JSON.stringify(globalThis.__textuaryLibraryValues.textuarySavedArticles.articles[0])`);
const libraryResult = { ...libraryView, state: libraryState };

await call("Page.navigate", { url: `${fixtureOrigin}/saved.html?id=article-test` });
await new Promise((resolve) => setTimeout(resolve, 1400));
const savedResult = await evaluate(`JSON.stringify({
  reader: Boolean(document.querySelector('#local-reader-view')),
  title: document.querySelector('h1')?.textContent,
  paragraphs: document.querySelectorAll('#lr-content p').length,
  source: document.querySelector('footer a')?.href,
  method: document.querySelector('footer span')?.textContent,
  saveLabel: document.querySelector('#lr-save')?.textContent,
  saveDisabled: document.querySelector('#lr-save')?.disabled,
  libraryButton: Boolean(document.querySelector('#lr-library')),
  speechLabel: document.querySelector('#lr-speech-toggle')?.textContent,
  moreMenu: Boolean(document.querySelector('.lr-actions')),
  progress: Number(document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'))
})`);

console.log(JSON.stringify({ library: libraryResult, saved: savedResult }, null, 2));

if (
  libraryResult.heading !== "Your quiet reading library" ||
  libraryResult.cards !== 1 ||
  libraryResult.title !== savedArticle.title ||
  !libraryResult.count?.includes("1 saved") ||
  !libraryResult.storage?.includes("stored locally") ||
  libraryResult.visibleAfterMatch !== 1 ||
  libraryResult.visibleAfterMiss !== 0 ||
  !libraryResult.returnVisible ||
  !libraryResult.returnLabel?.includes("Return to article") ||
  libraryResult.state.read !== true ||
  libraryResult.state.progress !== 1 ||
  !savedResult.reader ||
  savedResult.title !== savedArticle.title ||
  savedResult.paragraphs !== 8 ||
  savedResult.source !== savedArticle.sourceUrl ||
  !savedResult.method?.includes("Saved locally") ||
  savedResult.saveLabel !== "Saved ✓" ||
  !savedResult.saveDisabled ||
  !savedResult.libraryButton ||
  savedResult.speechLabel !== "Resume aloud" ||
  !savedResult.moreMenu ||
  savedResult.progress < 35
) process.exitCode = 1;

socket.close();

async function evaluate(expression) {
  const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || "Browser evaluation failed");
  return JSON.parse(result.result.value);
}
