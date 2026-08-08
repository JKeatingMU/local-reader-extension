(() => {
  "use strict";

  const LIBRARY_KEY = "textuarySavedArticles";
  const storage = globalThis.browser?.storage?.local || globalThis.chrome?.storage?.local;
  const runtime = globalThis.browser?.runtime || globalThis.chrome?.runtime;
  const list = document.getElementById("library-list");
  const empty = document.getElementById("library-empty");
  const count = document.getElementById("library-count");
  const usage = document.getElementById("library-storage");
  const search = document.getElementById("library-search");
  const filter = document.getElementById("library-filter");
  const clear = document.getElementById("library-clear");
  const returnButton = document.getElementById("library-return");
  const template = document.getElementById("article-card-template");
  const returnTabValue = new URLSearchParams(location.search).get("returnTab");
  const returnTabId = returnTabValue === null ? NaN : Number(returnTabValue);
  let library = { version: 1, articles: [] };

  search.addEventListener("input", render);
  filter.addEventListener("change", render);
  clear.addEventListener("click", clearLibrary);
  if (Number.isInteger(returnTabId) && returnTabId >= 0) {
    returnButton.hidden = false;
    returnButton.addEventListener("click", returnToArticle);
  }
  void loadLibrary();

  async function returnToArticle() {
    returnButton.disabled = true;
    returnButton.textContent = "Returning…";
    try {
      if (!runtime?.sendMessage) throw new Error("The extension could not reach the original article tab");
      const response = await runtime.sendMessage({
        type: "textuary-return-to-article",
        returnTabId
      });
      if (response?.ok === false) throw new Error(response.error);
    } catch (error) {
      returnButton.disabled = false;
      returnButton.textContent = safeError(error).includes("no longer available")
        ? "Article tab was closed"
        : "← Return to article";
    }
  }

  async function loadLibrary() {
    if (!storage) {
      count.textContent = "Local extension storage is unavailable.";
      clear.disabled = true;
      return;
    }
    try {
      const result = await storage.get(LIBRARY_KEY);
      library = normalizeLibrary(result?.[LIBRARY_KEY]);
      render();
    } catch (error) {
      count.textContent = `Textuary could not load the library: ${safeError(error)}`;
    }
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const mode = filter.value;
    const articles = library.articles
      .filter((article) => {
        if (mode === "unread" && article.read) return false;
        if (mode === "finished" && !article.read) return false;
        if (!query) return true;
        return [article.title, article.siteName, article.byline, article.description]
          .some((value) => String(value || "").toLocaleLowerCase().includes(query));
      })
      .sort((left, right) => right.savedAt - left.savedAt);

    list.replaceChildren(...articles.map(articleCard));
    empty.hidden = library.articles.length !== 0 || Boolean(query) || mode !== "all";
    if (!articles.length && library.articles.length) {
      const message = document.createElement("p");
      message.className = "library-empty";
      message.textContent = "No saved articles match this view.";
      list.append(message);
    }

    const unread = library.articles.filter((article) => !article.read).length;
    count.textContent = `${library.articles.length.toLocaleString()} saved · ${unread.toLocaleString()} unread`;
    usage.textContent = `${formatBytes(new Blob([JSON.stringify(library)]).size)} stored locally`;
    clear.disabled = library.articles.length === 0;
  }

  function articleCard(article) {
    const card = template.content.firstElementChild.cloneNode(true);
    const readUrl = runtime.getURL(`saved.html?id=${encodeURIComponent(article.id)}`);
    const title = card.querySelector(".article-title");
    const read = card.querySelector(".article-read");
    const state = card.querySelector(".article-state");
    const remove = card.querySelector(".article-delete");
    const progress = Math.round(Math.max(0, Math.min(1, Number(article.progress) || 0)) * 100);

    card.querySelector(".article-site").textContent = article.siteName || hostname(article.sourceUrl);
    title.textContent = article.title || "Saved article";
    title.href = readUrl;
    card.querySelector(".article-description").textContent = article.description || "";
    card.querySelector(".article-details").textContent = [
      article.byline,
      `${Number(article.readingMinutes) || 1} min read`,
      article.read ? "Finished" : progress ? `${progress}% read` : "Unread",
      `Saved ${formatDate(article.savedAt)}`
    ].filter(Boolean).join(" · ");
    card.querySelector(".article-progress").setAttribute("aria-valuenow", String(progress));
    card.querySelector(".article-progress span").style.width = `${progress}%`;
    read.href = readUrl;
    state.textContent = article.read ? "Mark unread" : "Mark finished";
    state.addEventListener("click", () => void updateState(article.id, !article.read));
    remove.addEventListener("click", () => void deleteArticle(article));
    return card;
  }

  async function updateState(id, read) {
    const article = library.articles.find((candidate) => candidate.id === id);
    if (!article) return;
    article.read = read;
    article.progress = read ? 1 : Math.min(Number(article.progress) || 0, .95);
    await saveLibrary();
  }

  async function deleteArticle(article) {
    if (!confirm(`Delete “${article.title || "this article"}” from Textuary?`)) return;
    library.articles = library.articles.filter((candidate) => candidate.id !== article.id);
    await saveLibrary();
  }

  async function clearLibrary() {
    if (!library.articles.length || !confirm("Delete every saved Textuary article from this browser?")) return;
    library = { version: 1, articles: [] };
    await saveLibrary();
  }

  async function saveLibrary() {
    try {
      await storage.set({ [LIBRARY_KEY]: library });
      render();
    } catch (error) {
      alert(`Textuary could not update the library: ${safeError(error)}`);
    }
  }

  function normalizeLibrary(value) {
    const articles = Array.isArray(value?.articles) ? value.articles : [];
    return {
      version: 1,
      articles: articles.filter((article) =>
        article && typeof article.id === "string" && typeof article.content === "string"
      )
    };
  }

  function hostname(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch { return "Saved article"; }
  }

  function formatDate(value) {
    const date = new Date(Number(value));
    return Number.isNaN(date.valueOf()) ? "" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  }

  function safeError(error) {
    return String(error?.message || error || "unknown error").replace(/\s+/g, " ").slice(0, 160);
  }
})();
