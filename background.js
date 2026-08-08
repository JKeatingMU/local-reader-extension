const extensionApi = globalThis.browser ?? globalThis.chrome;

if (!extensionApi) throw new Error("Textuary could not find a Web Extensions API");

const NATIVE_SPEECH_MESSAGE = "textuary-native-speech";

if (extensionApi.runtime?.onMessage?.addListener) {
  extensionApi.runtime.onMessage.addListener((message, sender) => {
    if (message?.type === "textuary-open-library") {
      if (typeof extensionApi.tabs?.create !== "function") {
        return Promise.resolve({ ok: false, error: "The browser could not open the library" });
      }
      const currentTabId = Number.isInteger(sender?.tab?.id) ? sender.tab.id : null;
      const libraryUrl = new URL(extensionApi.runtime.getURL("library.html"));
      if (currentTabId !== null && typeof extensionApi.tabs?.update === "function") {
        libraryUrl.searchParams.set("returnTo", "article");
        if (sender.tab.url) libraryUrl.searchParams.set("sourceUrl", sender.tab.url);
        const progress = Math.max(0, Math.min(1, Number(message.progress) || 0));
        libraryUrl.searchParams.set("returnProgress", String(progress));
        return Promise.resolve(extensionApi.tabs.update(currentTabId, { url: libraryUrl.href }))
          .then(() => ({ ok: true }))
          .catch((error) => ({ ok: false, error: String(error?.message || error) }));
      }
      return Promise.resolve(extensionApi.tabs.create({ url: libraryUrl.href }))
        .then(() => ({ ok: true }))
        .catch((error) => ({ ok: false, error: String(error?.message || error) }));
    }

    if (message?.type === "textuary-return-to-reader") {
      const tabId = sender?.tab?.id;
      if (!Number.isInteger(tabId)) {
        return Promise.resolve({ ok: false, error: "The browser could not identify the Library tab" });
      }
      return returnToReader(tabId, message.sourceUrl, message.progress)
        .then(() => ({ ok: true }))
        .catch((error) => ({ ok: false, error: String(error?.message || error) }));
    }

    if (message?.type === NATIVE_SPEECH_MESSAGE) {
      if (typeof extensionApi.runtime.sendNativeMessage !== "function") {
        return Promise.resolve({ ok: false, error: "Safari's native speech bridge is unavailable" });
      }
      return Promise.resolve(extensionApi.runtime.sendNativeMessage(
        "com.jgkeating.textuary.Extension",
        message.payload || {}
      )).catch((error) => ({ ok: false, error: String(error?.message || error) }));
    }

    return undefined;
  });
}

async function returnToReader(tabId, sourceUrl, progress) {
  if (typeof extensionApi.tabs?.goBack === "function") {
    await extensionApi.tabs.goBack(tabId);
  } else if (typeof extensionApi.tabs?.update === "function" && sourceUrl) {
    await extensionApi.tabs.update(tabId, { url: sourceUrl });
  } else {
    throw new Error("The browser could not return to the article");
  }

  if (!/^https?:\/\//i.test(sourceUrl || "")) return;

  let readerPresent = false;
  for (let attempt = 0; attempt < 16; attempt += 1) {
    try {
      const result = await extensionApi.scripting.executeScript({
        target: { tabId },
        func: () => ({
          reader: Boolean(document.getElementById("local-reader-view")),
          ready: document.readyState === "complete"
        })
      });
      readerPresent = Boolean(result?.[0]?.result?.reader);
      if (readerPresent || result?.[0]?.result?.ready) break;
    } catch {
      // The restored page may not yet be ready for script execution.
    }
    await delay(150);
  }

  if (!readerPresent) {
    await extensionApi.scripting.executeScript({
      target: { tabId },
      files: ["vendor/Readability.js", "vendor/purify.min.js", "reader.js"]
    });
  }

  const normalizedProgress = Math.max(0, Math.min(1, Number(progress) || 0));
  if (!normalizedProgress) return;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await extensionApi.scripting.executeScript({
      target: { tabId },
      func: (ratio) => {
        if (!document.getElementById("local-reader-view")) return false;
        const available = Math.max(0, document.documentElement.scrollHeight - innerHeight);
        scrollTo(0, available * ratio);
        return true;
      },
      args: [normalizedProgress]
    }).catch(() => []);
    if (result?.[0]?.result) return;
    await delay(150);
  }
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

extensionApi.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !/^https?:\/\//i.test(tab.url || "")) {
    if (typeof extensionApi.tabs?.create === "function") {
      await extensionApi.tabs.create({ url: extensionApi.runtime.getURL("library.html") });
    } else {
      await setBadge(tab.id, "WEB", "#6b7280");
    }
    return;
  }

  try {
    await extensionApi.scripting.executeScript({
      target: { tabId: tab.id },
      files: [
        "vendor/Readability.js",
        "vendor/purify.min.js",
        "reader.js"
      ]
    });
    await setBadge(tab.id, "", "#2563eb");
  } catch (error) {
    console.error("Textuary could not run", error);
    await setBadge(tab.id, "ERR", "#b91c1c");
  }
});

async function setBadge(tabId, text, color) {
  if (!tabId) return;
  await extensionApi.action.setBadgeBackgroundColor({ tabId, color });
  await extensionApi.action.setBadgeText({ tabId, text });
  if (text) {
    setTimeout(() => {
      void Promise.resolve(extensionApi.action.setBadgeText({ tabId, text: "" })).catch(() => {});
    }, 2500);
  }
}
