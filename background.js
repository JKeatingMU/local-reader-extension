const extensionApi = globalThis.browser ?? globalThis.chrome;

if (!extensionApi) throw new Error("Textuary could not find a Web Extensions API");

const NATIVE_SPEECH_MESSAGE = "textuary-native-speech";

if (extensionApi.runtime?.onMessage?.addListener) {
  extensionApi.runtime.onMessage.addListener((message) => {
    if (message?.type !== NATIVE_SPEECH_MESSAGE) return undefined;
    if (typeof extensionApi.runtime.sendNativeMessage !== "function") {
      return Promise.resolve({ ok: false, error: "Safari's native speech bridge is unavailable" });
    }
    return Promise.resolve(extensionApi.runtime.sendNativeMessage(
      "com.jgkeating.textuary.Extension",
      message.payload || {}
    )).catch((error) => ({ ok: false, error: String(error?.message || error) }));
  });
}

extensionApi.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !/^https?:\/\//i.test(tab.url || "")) {
    await setBadge(tab.id, "WEB", "#6b7280");
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
