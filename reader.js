(() => {
  "use strict";

  const READER_ID = "local-reader-view";
  if (document.getElementById(READER_ID)) {
    globalThis.speechSynthesis?.cancel();
    location.reload();
    return;
  }

  if (typeof globalThis.Readability !== "function" || typeof globalThis.DOMPurify?.sanitize !== "function") {
    showNotice("Local Reader could not load its article engine. Reload the extension and try again.");
    return;
  }

  void openReader();

  async function openReader() {
    const sourceUrl = location.href;
    const sourceArticlePromise = fetchSourceArticle(sourceUrl);
    const leadImage = {
      src: firstText(['meta[property="og:image"]', 'meta[name="twitter:image"]'], true),
      alt: firstText(['meta[property="og:image:alt"]', 'meta[name="twitter:image:alt"]'], true)
    };
    let renderedArticle = parseDocument(document);

    if (!isUsable(renderedArticle)) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      renderedArticle = parseDocument(document);
    }

    const sourceArticle = await sourceArticlePromise;
    const selection = chooseBestArticle(renderedArticle, sourceArticle);
    const article = selection.article;
    if (!isUsable(article)) {
      showNotice("Local Reader could not identify a complete article on this page.");
      return;
    }

    const content = sanitizeContent(article.content, sourceUrl);
    removeGenericDisclosures(content);
    addLeadImageIfMissing(content, leadImage, sourceUrl);
    const paragraphCount = content.querySelectorAll("p").length;
    const textLength = content.textContent.replace(/\s+/g, " ").trim().length;
    if (paragraphCount < 2 || textLength < 400) {
      showNotice("Local Reader found some text, but not enough for a complete article.");
      return;
    }

    const title = article.title || firstText([
      'meta[property="og:title"]',
      'meta[name="twitter:title"]'
    ], true) || firstText(["h1"]) || document.title;
    const description = article.excerpt || firstText([
      'meta[name="description"]',
      'meta[property="og:description"]'
    ], true);
    const byline = normalizeByline(article.byline || "");
    const published = article.publishedTime || firstText(["time"]);
    const siteName = article.siteName || firstText(['meta[property="og:site_name"]'], true) || hostnameLabel(sourceUrl);

    renderReader({
      sourceUrl,
      title,
      description,
      byline,
      published,
      siteName,
      content,
      paragraphCount,
      textLength,
      language: article.lang || document.documentElement.lang || navigator.language,
      extractionMethod: selection.method
    });
  }

  function parseDocument(sourceDocument) {
    const clone = sourceDocument.cloneNode(true);
    clone.querySelectorAll([
      "script",
      "style",
      "noscript",
      "template",
      "iframe",
      "dialog",
      "form",
      "nav",
      "[role='dialog']",
      "[role='navigation']",
      "[aria-modal='true']"
    ].join(",")).forEach((node) => node.remove());

    try {
      return new Readability(clone, {
        charThreshold: 1200,
        keepClasses: false,
        nbTopCandidates: 8
      }).parse();
    } catch (error) {
      console.warn("Local Reader could not distil this document", error);
      return null;
    }
  }

  async function fetchSourceArticle(sourceUrl) {
    if (!/^https?:\/\//i.test(sourceUrl)) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(sourceUrl, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        redirect: "follow",
        headers: { Accept: "text/html,application/xhtml+xml" },
        signal: controller.signal
      });
      if (!response.ok) return null;
      const contentType = response.headers.get("content-type") || "";
      if (!/html|xhtml/i.test(contentType)) return null;

      const html = await response.text();
      if (html.length < 400 || html.length > 10_000_000) return null;
      const sourceDocument = new DOMParser().parseFromString(html, "text/html");
      const base = sourceDocument.createElement("base");
      base.href = response.url || sourceUrl;
      sourceDocument.head.prepend(base);
      return parseDocument(sourceDocument);
    } catch (error) {
      if (error?.name !== "AbortError") console.info("Local Reader source fallback was unavailable", error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  function chooseBestArticle(renderedArticle, sourceArticle) {
    if (!isUsable(renderedArticle) && !isUsable(sourceArticle)) {
      return { article: null, method: "No complete article" };
    }
    if (!isUsable(renderedArticle)) {
      return { article: sourceArticle, method: "Original page HTML" };
    }
    if (!isUsable(sourceArticle)) {
      return { article: renderedArticle, method: "Rendered page" };
    }

    const rendered = articleMetrics(renderedArticle);
    const source = articleMetrics(sourceArticle);
    const sourceIsClearlyMoreComplete =
      source.textLength >= rendered.textLength + 600 &&
      source.score >= rendered.score * 1.15;

    return sourceIsClearlyMoreComplete
      ? { article: sourceArticle, method: "Original page HTML" }
      : { article: renderedArticle, method: "Rendered page" };
  }

  function articleMetrics(article) {
    if (!article?.content) return { textLength: 0, paragraphs: 0, score: 0 };
    const parsed = new DOMParser().parseFromString(article.content, "text/html");
    const textLength = article.textContent.replace(/\s+/g, " ").trim().length;
    const paragraphs = parsed.querySelectorAll("p").length;
    const images = parsed.querySelectorAll("img").length;
    return {
      textLength,
      paragraphs,
      score: textLength + Math.min(paragraphs, 200) * 120 + Math.min(images, 20) * 100
    };
  }

  function isUsable(article) {
    if (!article?.content || !article?.textContent) return false;
    const text = article.textContent.replace(/\s+/g, " ").trim();
    const errorSample = `${article.title || ""} ${text.slice(0, 500)}`;
    return text.length >= 400 && !/access denied|verify you are human|captcha challenge/i.test(errorSample);
  }

  function sanitizeContent(html, baseUrl) {
    const allowedTags = [
      "a", "abbr", "article", "b", "blockquote", "br", "cite", "code",
      "dd", "div", "dl", "dt", "em", "figcaption", "figure", "h2", "h3",
      "h4", "h5", "h6", "hr", "i", "img", "li", "mark", "ol", "p",
      "picture", "pre", "s", "section", "source", "strong", "sub", "sup",
      "table", "tbody", "td", "tfoot", "th", "thead", "time", "tr", "u", "ul"
    ];
    const allowedAttributes = [
      "alt", "cite", "colspan", "datetime", "height", "href", "media",
      "rowspan", "sizes", "src", "srcset", "title", "type", "width"
    ];
    const clean = document.createElement("div");
    clean.innerHTML = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: allowedAttributes,
      ALLOW_DATA_ATTR: false,
      ALLOW_ARIA_ATTR: false
    });

    clean.querySelectorAll("a").forEach((link) => {
      const href = resolveUrl(link.getAttribute("href"), baseUrl);
      if (href && /^https?:/i.test(href)) {
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.removeAttribute("href");
      }
    });

    clean.querySelectorAll("img").forEach((image) => {
      const src = resolveUrl(image.getAttribute("src"), baseUrl);
      if (src && /^(https?:|data:image\/)/i.test(src)) image.src = src;
      else image.remove();
      image.loading = "lazy";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer-when-downgrade";
    });

    clean.querySelectorAll("source").forEach((source) => {
      const src = resolveUrl(source.getAttribute("src"), baseUrl);
      if (src && /^https?:/i.test(src)) source.src = src;
      else source.removeAttribute("src");
    });

    clean.querySelectorAll("p, div, section, figure").forEach((node) => {
      if (!node.textContent.trim() && !node.querySelector("img, picture, hr")) node.remove();
    });
    return clean;
  }

  function removeGenericDisclosures(content) {
    const openingParagraphs = [...content.querySelectorAll("p")].slice(0, 4);
    for (const paragraph of openingParagraphs) {
      const text = paragraph.textContent.replace(/\s+/g, " ").trim();
      const mentionsCommercialRelationship = /affiliate|earn (?:a )?commission|commercial relationship/i.test(text);
      const mentionsCommerce = /purchase|product|shopping|retailer|links? on this page/i.test(text);
      if (text.length < 320 && mentionsCommercialRelationship && mentionsCommerce) paragraph.remove();
    }
  }

  function addLeadImageIfMissing(content, leadImage, baseUrl) {
    if (content.querySelector("img") || !leadImage.src) return;
    const src = resolveUrl(leadImage.src, baseUrl);
    if (!/^https?:/i.test(src)) return;

    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.src = src;
    image.alt = leadImage.alt || "";
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer-when-downgrade";
    figure.append(image);
    content.prepend(figure);
  }

  function renderReader(data) {
    const safeTitle = escapeHtml(data.title);
    const safeSiteName = escapeHtml(data.siteName);
    const safeDescription = data.description && data.description !== data.title
      ? `<p class="lr-standfirst">${escapeHtml(data.description)}</p>`
      : "";
    const metadata = [data.byline, formatDate(data.published)]
      .filter(Boolean)
      .map((value) => `<span>${escapeHtml(value)}</span>`)
      .join("");

    window.stop();
    document.documentElement.innerHTML = `
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${safeTitle} — Local Reader</title>
        <style>${readerCss()}</style>
      </head>
      <body>
        <div id="${READER_ID}">
          <header class="lr-toolbar" aria-label="Reader controls">
            <button id="lr-original" type="button" title="Reload the original article">← Original page</button>
            <div class="lr-tools">
              <button id="lr-smaller" type="button" aria-label="Decrease text size">A−</button>
              <button id="lr-larger" type="button" aria-label="Increase text size">A+</button>
              <button id="lr-theme" type="button" aria-label="Switch colour theme">Dark</button>
              <button id="lr-speech-toggle" type="button">Read aloud</button>
              <button id="lr-speech-stop" type="button" disabled>Stop</button>
              <button id="lr-print" type="button">Print</button>
            </div>
          </header>
          <main class="lr-page">
            <article>
              <p class="lr-kicker">${safeSiteName} · Local Reader</p>
              <h1>${safeTitle}</h1>
              ${safeDescription}
              <p class="lr-byline">${metadata}</p>
              <div class="lr-rule"></div>
              <div id="lr-content">${data.content.innerHTML}</div>
              <footer>
                <a href="${escapeAttribute(data.sourceUrl)}">View the original article</a>
                <span>${data.paragraphCount} paragraphs · ${data.textLength.toLocaleString()} characters · ${escapeHtml(data.extractionMethod)}</span>
              </footer>
            </article>
          </main>
        </div>
      </body>`;

    document.getElementById("lr-original").addEventListener("click", () => location.reload());
    document.getElementById("lr-print").addEventListener("click", () => window.print());
    setupReadAloud(data.language);

    let fontSize = 20;
    document.getElementById("lr-smaller").addEventListener("click", () => {
      fontSize = Math.max(16, fontSize - 1);
      document.documentElement.style.setProperty("--lr-font-size", `${fontSize}px`);
    });
    document.getElementById("lr-larger").addEventListener("click", () => {
      fontSize = Math.min(28, fontSize + 1);
      document.documentElement.style.setProperty("--lr-font-size", `${fontSize}px`);
    });
    document.getElementById("lr-theme").addEventListener("click", (event) => {
      const isDark = document.body.classList.toggle("lr-dark");
      event.currentTarget.textContent = isDark ? "Light" : "Dark";
    });
  }

  function setupReadAloud(language) {
    const toggle = document.getElementById("lr-speech-toggle");
    const stop = document.getElementById("lr-speech-stop");
    const synth = globalThis.speechSynthesis;
    const Utterance = globalThis.SpeechSynthesisUtterance;

    if (!synth || typeof Utterance !== "function") {
      toggle.disabled = true;
      toggle.textContent = "Read aloud unavailable";
      return;
    }

    const chunks = buildSpeechChunks();
    let state = "idle";
    let chunkIndex = 0;
    let session = 0;

    toggle.addEventListener("click", () => {
      if (state === "playing") {
        synth.pause();
        state = "paused";
        updateSpeechControls();
        return;
      }

      if (state === "paused") {
        synth.resume();
        state = "playing";
        updateSpeechControls();
        return;
      }

      if (!chunks.length) {
        showNotice("Local Reader could not find any text to read aloud.");
        return;
      }

      session += 1;
      chunkIndex = 0;
      state = "playing";
      synth.cancel();
      if (synth.paused) synth.resume();
      updateSpeechControls();
      speakNext(session);
    });

    stop.addEventListener("click", stopSpeaking);
    window.addEventListener("pagehide", stopSpeaking, { once: true });

    function speakNext(activeSession) {
      if (activeSession !== session || state === "idle") return;
      if (chunkIndex >= chunks.length) {
        finishSpeaking();
        return;
      }

      const utterance = new Utterance(chunks[chunkIndex]);
      utterance.lang = language || navigator.language || "en";
      utterance.rate = 1;
      utterance.onend = () => {
        if (activeSession !== session) return;
        chunkIndex += 1;
        speakNext(activeSession);
      };
      utterance.onerror = (event) => {
        if (activeSession !== session || /canceled|interrupted/.test(event.error || "")) return;
        finishSpeaking();
        showNotice("Chrome could not read this article aloud with the selected system voice.");
      };
      synth.speak(utterance);
    }

    function stopSpeaking() {
      session += 1;
      synth.cancel();
      if (synth.paused) synth.resume();
      chunkIndex = 0;
      state = "idle";
      updateSpeechControls();
    }

    function finishSpeaking() {
      chunkIndex = 0;
      state = "idle";
      updateSpeechControls();
    }

    function updateSpeechControls() {
      toggle.textContent = state === "playing" ? "Pause" : state === "paused" ? "Resume" : "Read aloud";
      toggle.setAttribute("aria-pressed", String(state !== "idle"));
      stop.disabled = state === "idle";
    }

    updateSpeechControls();
  }

  function buildSpeechChunks() {
    const selectors = [
      "h1",
      ".lr-standfirst",
      "#lr-content h2",
      "#lr-content h3",
      "#lr-content h4",
      "#lr-content h5",
      "#lr-content h6",
      "#lr-content p",
      "#lr-content li",
      "#lr-content figcaption"
    ].join(",");
    const readableElements = [...document.querySelectorAll(selectors)]
      .filter((element) => !element.querySelector("p, li, h2, h3, h4, h5, h6"));
    return readableElements.flatMap((element) => splitForSpeech(
      element.textContent.replace(/\s+/g, " ").trim()
    ));
  }

  function splitForSpeech(text, maxLength = 320) {
    if (!text) return [];
    const sentences = typeof Intl.Segmenter === "function"
      ? [...new Intl.Segmenter(undefined, { granularity: "sentence" }).segment(text)].map(({ segment }) => segment.trim())
      : text.split(/(?<=[.!?])\s+/);
    const chunks = [];
    let current = "";

    for (const sentence of sentences.filter(Boolean)) {
      const pieces = sentence.length > maxLength ? splitLongSpeechText(sentence, maxLength) : [sentence];
      for (const piece of pieces) {
        if (current && current.length + piece.length + 1 > maxLength) {
          chunks.push(current);
          current = "";
        }
        current = current ? `${current} ${piece}` : piece;
      }
    }

    if (current) chunks.push(current);
    return chunks;
  }

  function splitLongSpeechText(text, maxLength) {
    const pieces = [];
    let remaining = text;
    while (remaining.length > maxLength) {
      const breakAt = remaining.lastIndexOf(" ", maxLength);
      const index = breakAt > maxLength / 2 ? breakAt : maxLength;
      pieces.push(remaining.slice(0, index).trim());
      remaining = remaining.slice(index).trim();
    }
    if (remaining) pieces.push(remaining);
    return pieces;
  }

  function firstText(selectors, metadata = false) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const value = metadata ? node?.content : node?.textContent;
      if (value?.trim()) return value.replace(/\s+/g, " ").trim();
    }
    return "";
  }

  function resolveUrl(value, baseUrl) {
    if (!value) return "";
    if (/^data:image\//i.test(value)) return value;
    try {
      return new URL(value, baseUrl).href;
    } catch {
      return "";
    }
  }

  function hostnameLabel(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "Article";
    }
  }

  function normalizeByline(value) {
    return value
      .replace(/([a-zÀ-ÿ])(?=(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b)/g, "$1 · ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  function showNotice(message) {
    document.getElementById("local-reader-notice")?.remove();
    const notice = document.createElement("div");
    notice.id = "local-reader-notice";
    notice.textContent = message;
    Object.assign(notice.style, {
      position: "fixed",
      zIndex: "2147483647",
      top: "18px",
      left: "50%",
      transform: "translateX(-50%)",
      maxWidth: "540px",
      padding: "12px 18px",
      borderRadius: "8px",
      background: "#111827",
      color: "white",
      boxShadow: "0 8px 30px rgba(0,0,0,.3)",
      font: "14px/1.45 system-ui, sans-serif"
    });
    document.documentElement.append(notice);
    setTimeout(() => notice.remove(), 5000);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function readerCss() {
    return `
      :root { color-scheme: light; --lr-font-size: 20px; --lr-bg: #f7f4ee; --lr-paper: #fff; --lr-text: #24211e; --lr-muted: #6b625b; --lr-line: #ded7cf; --lr-accent: #0d4a86; }
      * { box-sizing: border-box; }
      html { background: var(--lr-bg); scroll-behavior: smooth; }
      body { margin: 0; background: var(--lr-bg); color: var(--lr-text); font-family: Georgia, 'Times New Roman', serif; }
      body.lr-dark { color-scheme: dark; --lr-bg: #16191d; --lr-paper: #20242a; --lr-text: #e9e4dc; --lr-muted: #aaa39a; --lr-line: #3b4047; --lr-accent: #8ec5ff; }
      .lr-toolbar { position: sticky; top: 0; z-index: 10; display: flex; justify-content: space-between; gap: 12px; padding: 10px max(16px, calc((100vw - 840px) / 2)); border-bottom: 1px solid var(--lr-line); background: color-mix(in srgb, var(--lr-paper) 94%, transparent); backdrop-filter: blur(10px); font: 14px/1.2 system-ui, sans-serif; }
      .lr-toolbar button { min-height: 36px; padding: 7px 11px; border: 1px solid var(--lr-line); border-radius: 7px; background: var(--lr-paper); color: var(--lr-text); cursor: pointer; }
      .lr-toolbar button:hover:not(:disabled) { border-color: var(--lr-accent); color: var(--lr-accent); }
      .lr-toolbar button:disabled { cursor: default; opacity: .45; }
      #lr-speech-toggle[aria-pressed="true"] { border-color: var(--lr-accent); color: var(--lr-accent); }
      .lr-tools { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
      .lr-page { width: min(100%, 920px); margin: 0 auto; padding: 36px 24px 80px; }
      .lr-page > article { padding: clamp(26px, 6vw, 68px); border: 1px solid var(--lr-line); border-radius: 3px; background: var(--lr-paper); box-shadow: 0 18px 50px rgba(53, 43, 32, .08); }
      .lr-kicker { margin: 0 0 14px; color: var(--lr-accent); font: 700 12px/1.2 system-ui, sans-serif; letter-spacing: .12em; text-transform: uppercase; }
      h1 { margin: 0; font-size: clamp(34px, 6vw, 56px); font-weight: 700; line-height: 1.04; letter-spacing: -.035em; text-wrap: balance; }
      .lr-standfirst { margin: 24px 0 0; color: var(--lr-muted); font-size: clamp(20px, 3vw, 25px); line-height: 1.42; }
      .lr-byline { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 24px 0 0; color: var(--lr-muted); font: 13px/1.5 system-ui, sans-serif; }
      .lr-rule { width: 72px; height: 3px; margin: 28px 0 34px; background: var(--lr-accent); }
      #lr-content { overflow-wrap: anywhere; }
      #lr-content p, #lr-content li { font-size: var(--lr-font-size); line-height: 1.72; }
      #lr-content p { margin: 0 0 1.05em; }
      #lr-content > *:first-child:is(p, div) > p:first-child::first-letter, #lr-content > p:first-child::first-letter { float: left; margin: .05em .1em 0 0; color: var(--lr-accent); font-size: 3.5em; font-weight: 700; line-height: .8; }
      #lr-content h2, #lr-content h3, #lr-content h4 { margin: 2.1em 0 .7em; font-family: system-ui, sans-serif; line-height: 1.18; letter-spacing: -.025em; }
      #lr-content h2 { font-size: clamp(25px, 4vw, 34px); }
      #lr-content h3 { font-size: clamp(21px, 3vw, 27px); }
      #lr-content ul, #lr-content ol { margin: 1.2em 0; padding-left: 1.6em; }
      #lr-content blockquote { margin: 1.5em 0; padding: .2em 0 .2em 1.2em; border-left: 4px solid var(--lr-accent); color: var(--lr-muted); }
      #lr-content pre, #lr-content code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      #lr-content pre { overflow-x: auto; padding: 16px; border-radius: 6px; background: var(--lr-bg); }
      #lr-content table { display: block; width: 100%; overflow-x: auto; border-collapse: collapse; font: 15px/1.5 system-ui, sans-serif; }
      #lr-content th, #lr-content td { padding: 8px 10px; border: 1px solid var(--lr-line); text-align: left; }
      #lr-content a, footer a { color: var(--lr-accent); text-decoration-thickness: 1px; text-underline-offset: 3px; }
      #lr-content figure { margin: 2.2em 0; }
      #lr-content img { display: block; width: auto; height: auto; max-width: 100%; max-height: 760px; margin: 2em auto; border-radius: 2px; object-fit: contain; background: var(--lr-bg); }
      #lr-content figcaption { margin-top: -1.5em; color: var(--lr-muted); font: 12px/1.45 system-ui, sans-serif; }
      footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-top: 48px; padding-top: 18px; border-top: 1px solid var(--lr-line); color: var(--lr-muted); font: 12px/1.5 system-ui, sans-serif; }
      @media (max-width: 600px) { .lr-page { padding: 0; } .lr-page > article { border: 0; padding: 34px 20px 60px; } .lr-tools button:nth-child(1), .lr-tools button:nth-child(2) { display: none; } }
      @media print { .lr-toolbar { display: none; } html, body, .lr-page, .lr-page > article { background: white; color: black; } .lr-page { width: 100%; padding: 0; } .lr-page > article { border: 0; box-shadow: none; padding: 0; } }
    `;
  }
})();
