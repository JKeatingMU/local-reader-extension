import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../background.js", import.meta.url), "utf8");

for (const namespace of ["browser", "chrome"]) {
  const calls = [];
  let onClicked;
  let onMessage;
  const api = {
    action: {
      onClicked: { addListener(listener) { onClicked = listener; } },
      async setBadgeBackgroundColor(options) { calls.push(["badgeColor", options]); },
      async setBadgeText(options) { calls.push(["badgeText", options]); }
    },
    scripting: {
      async executeScript(options) {
        calls.push(["executeScript", options]);
        return options.func ? [{ result: { reader: false, ready: true } }] : undefined;
      }
    },
    tabs: {
      async create(options) { calls.push(["tabCreate", options]); },
      async update(tabId, options) { calls.push(["tabUpdate", { tabId, ...options }]); },
      async goBack(tabId) { calls.push(["tabGoBack", tabId]); }
    },
    runtime: {
      onMessage: { addListener(listener) { onMessage = listener; } },
      getURL(path) { return `${namespace}-extension://textuary/${path}`; },
      async sendNativeMessage(application, payload) {
        calls.push(["nativeMessage", { application, payload }]);
        return { ok: true, engine: "AVSpeechSynthesizer" };
      }
    }
  };
  const context = {
    console,
    Promise,
    URL,
    setTimeout(callback) { callback(); },
    [namespace]: api
  };
  context.globalThis = context;
  vm.runInNewContext(source, context, { filename: "background.js" });

  assert.equal(typeof onClicked, "function", `${namespace} action listener`);
  await onClicked({ id: 7, url: "https://example.com/article" });
  assert.deepEqual(
    Array.from(calls.find(([type]) => type === "executeScript")?.[1].files || []),
    ["vendor/Readability.js", "vendor/purify.min.js", "reader.js"],
    `${namespace} script injection`
  );

  calls.length = 0;
  await onClicked({ id: 8, url: "safari-web-extension://settings" });
  assert.ok(
    calls.some(([type, options]) => type === "tabCreate" && options.url.endsWith("/library.html")),
    `${namespace} unsupported page opens library`
  );

  calls.length = 0;
  const libraryResponse = await onMessage(
    { type: "textuary-open-library", progress: .37 },
    { tab: { id: 7, url: "https://example.com/article" } }
  );
  assert.equal(libraryResponse.ok, true, `${namespace} library response`);
  assert.ok(
    calls.some(([type, options]) =>
      type === "tabUpdate" &&
      options.tabId === 7 &&
      options.url.includes("/library.html?returnTo=article") &&
      options.url.includes("sourceUrl=https%3A%2F%2Fexample.com%2Farticle") &&
      options.url.includes("returnProgress=0.37")
    ),
    `${namespace} library replaces reader tab`
  );

  calls.length = 0;
  const returnResponse = await onMessage(
    { type: "textuary-return-to-reader", sourceUrl: "https://example.com/article", progress: .37 },
    { tab: { id: 7 } }
  );
  assert.equal(returnResponse.ok, true, `${namespace} return response`);
  assert.ok(calls.some(([type, tabId]) => type === "tabGoBack" && tabId === 7), `${namespace} same-tab return`);
  assert.ok(
    calls.some(([type, options]) =>
      type === "executeScript" && Array.from(options.files || []).includes("reader.js")
    ),
    `${namespace} restores reader when history reloads the article`
  );
  assert.ok(
    calls.some(([type, options]) =>
      type === "executeScript" && Array.from(options.args || [])[0] === .37
    ),
    `${namespace} restores reading position`
  );

  calls.length = 0;
  const nativeResponse = await onMessage({
    type: "textuary-native-speech",
    payload: { command: "ping" }
  });
  assert.equal(nativeResponse.engine, "AVSpeechSynthesizer", `${namespace} native speech response`);
  assert.ok(
    calls.some(([type, options]) =>
      type === "nativeMessage" &&
      options.application === "com.jgkeating.textuary.Extension" &&
      options.payload.command === "ping"
    ),
    `${namespace} native speech forwarding`
  );
}

console.log("Background compatibility: browser and chrome namespaces");
