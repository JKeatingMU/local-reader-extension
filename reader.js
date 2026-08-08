(() => {
  "use strict";

  const READER_ID = "local-reader-view";
  const PRODUCT_NAME = "Textuary";
  const PREFERENCES_KEY = "textuaryReadingPreferences";
  const LIBRARY_KEY = "textuarySavedArticles";
  const KOKORO_MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
  const KOKORO_VOICES = Object.freeze([
    ["af_heart", "Heart", "US", "female"],
    ["af_bella", "Bella", "US", "female"],
    ["af_nicole", "Nicole", "US", "female"],
    ["af_aoede", "Aoede", "US", "female"],
    ["af_kore", "Kore", "US", "female"],
    ["af_sarah", "Sarah", "US", "female"],
    ["af_alloy", "Alloy", "US", "female"],
    ["af_nova", "Nova", "US", "female"],
    ["af_river", "River", "US", "female"],
    ["af_sky", "Sky", "US", "female"],
    ["af_jessica", "Jessica", "US", "female"],
    ["am_fenrir", "Fenrir", "US", "male"],
    ["am_michael", "Michael", "US", "male"],
    ["am_puck", "Puck", "US", "male"],
    ["am_liam", "Liam", "US", "male"],
    ["am_onyx", "Onyx", "US", "male"],
    ["am_eric", "Eric", "US", "male"],
    ["am_echo", "Echo", "US", "male"],
    ["am_adam", "Adam", "US", "male"],
    ["am_santa", "Santa", "US", "male"],
    ["bf_emma", "Emma", "British", "female"],
    ["bf_isabella", "Isabella", "British", "female"],
    ["bf_alice", "Alice", "British", "female"],
    ["bf_lily", "Lily", "British", "female"],
    ["bm_fable", "Fable", "British", "male"],
    ["bm_george", "George", "British", "male"],
    ["bm_lewis", "Lewis", "British", "male"],
    ["bm_daniel", "Daniel", "British", "male"]
  ]);
  const DEFAULT_PREFERENCES = Object.freeze({
    theme: "paper",
    fontFamily: "editorial",
    fontSize: 20,
    lineHeight: 1.72,
    columnWidth: 1040,
    speechEngine: "system",
    speechVoice: "",
    speechRate: "1",
    appleVoice: "",
    kokoroVoice: "bf_emma",
    kokoroConsent: false
  });
  const isSavedDocument = /\/saved\.html$/i.test(location.pathname);
  if (document.getElementById(READER_ID)) {
    globalThis.speechSynthesis?.cancel();
    if (!isSavedDocument) location.reload();
    return;
  }

  if (typeof globalThis.Readability !== "function" || typeof globalThis.DOMPurify?.sanitize !== "function") {
    showNotice(`${PRODUCT_NAME} could not load its article engine. Reload the extension and try again.`);
    return;
  }

  void (isSavedDocument ? openSavedReader() : openReader());

  async function openSavedReader() {
    const savedId = new URLSearchParams(location.search).get("id") || "";
    const library = await loadLibrary();
    const saved = library.articles.find((article) => article.id === savedId);
    if (!saved) {
      showNotice(`${PRODUCT_NAME} could not find that saved article. Open the Library and choose another article.`);
      return;
    }

    const content = sanitizeContent(saved.content, saved.sourceUrl);
    const paragraphCount = content.querySelectorAll("p").length;
    const textLength = content.textContent.replace(/\s+/g, " ").trim().length;
    const wordCount = Number(saved.wordCount) || countWords(content.textContent, saved.language);
    const readingMinutes = Number(saved.readingMinutes) || Math.max(1, Math.ceil(wordCount / 225));
    const preferences = await loadPreferences();

    renderReader({
      sourceUrl: saved.sourceUrl,
      title: saved.title,
      description: saved.description,
      byline: saved.byline,
      published: saved.published,
      siteName: saved.siteName,
      content,
      paragraphCount,
      textLength,
      wordCount,
      readingMinutes,
      language: saved.language || navigator.language,
      extractionMethod: "Saved locally",
      preferences,
      isSavedView: true,
      savedArticleId: saved.id,
      savedProgress: Math.max(0, Math.min(1, Number(saved.progress) || 0))
    });
  }

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
      showNotice(`${PRODUCT_NAME} could not identify a complete article on this page.`);
      return;
    }

    const content = sanitizeContent(article.content, sourceUrl);
    removeMediaPlayerControls(content);
    removeGenericDisclosures(content);
    addLeadImageIfMissing(content, leadImage, sourceUrl);
    const paragraphCount = content.querySelectorAll("p").length;
    const textLength = content.textContent.replace(/\s+/g, " ").trim().length;
    if (paragraphCount < 2 || textLength < 400) {
      showNotice(`${PRODUCT_NAME} found some text, but not enough for a complete article.`);
      return;
    }

    const siteName = article.siteName || firstText(['meta[property="og:site_name"]'], true) || hostnameLabel(sourceUrl);
    const title = chooseBestTitle(article.title, [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]'
    ].map((selector) => firstText([selector], true)).concat([
      firstText(["h1"]),
      document.title
    ]), siteName, sourceUrl);
    const description = article.excerpt || firstText([
      'meta[name="description"]',
      'meta[property="og:description"]'
    ], true);
    const byline = normalizeByline(article.byline || "");
    const published = article.publishedTime || firstText(["time"]);
    const wordCount = countWords(content.textContent, article.lang || document.documentElement.lang);
    const readingMinutes = Math.max(1, Math.ceil(wordCount / 225));
    const preferences = await loadPreferences();

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
      wordCount,
      readingMinutes,
      language: article.lang || document.documentElement.lang || navigator.language,
      extractionMethod: selection.method,
      preferences
    });
  }

  function parseDocument(sourceDocument) {
    const clone = sourceDocument.cloneNode(true);
    prepareLazyMedia(clone);
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
      console.warn(`${PRODUCT_NAME} could not distil this document`, error);
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
      if (error?.name !== "AbortError") console.info(`${PRODUCT_NAME} source fallback was unavailable`, error);
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
      "table", "tbody", "td", "tfoot", "th", "thead", "time", "tr", "u", "ul",
      "video"
    ];
    const allowedAttributes = [
      "alt", "cite", "colspan", "controls", "datetime", "height", "href", "media",
      "muted", "playsinline", "poster", "preload", "rowspan", "sizes", "src", "srcset",
      "title", "type", "width"
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
      const src = resolveMediaUrl(image.getAttribute("src"), baseUrl, true);
      const srcset = resolveSrcset(image.getAttribute("srcset"), baseUrl);
      if (srcset) image.setAttribute("srcset", srcset);
      else image.removeAttribute("srcset");
      const fallbackSrc = src || firstSrcsetUrl(srcset);
      if (fallbackSrc) image.src = fallbackSrc;
      else image.remove();
      image.loading = "eager";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer-when-downgrade";
    });

    clean.querySelectorAll("source").forEach((source) => {
      const src = resolveMediaUrl(source.getAttribute("src"), baseUrl);
      const srcset = resolveSrcset(source.getAttribute("srcset"), baseUrl);
      if (src && /^https?:/i.test(src)) source.src = src;
      else source.removeAttribute("src");
      if (srcset) source.setAttribute("srcset", srcset);
      else source.removeAttribute("srcset");
    });

    clean.querySelectorAll("video").forEach((video) => {
      const src = resolveMediaUrl(video.getAttribute("src"), baseUrl);
      const poster = resolveMediaUrl(video.getAttribute("poster"), baseUrl, true);
      if (src) video.src = src;
      else video.removeAttribute("src");
      if (poster) video.poster = poster;
      else video.removeAttribute("poster");
      video.removeAttribute("autoplay");
      video.controls = true;
      video.preload = "metadata";
      video.setAttribute("playsinline", "");
    });

    clean.querySelectorAll("p, div, section, figure").forEach((node) => {
      if (!node.textContent.trim() && !node.querySelector("img, picture, video, hr")) node.remove();
    });
    return clean;
  }

  function prepareLazyMedia(sourceDocument) {
    sourceDocument.querySelectorAll("img").forEach((image) => {
      const lazySrc = firstUsefulAttribute(image, [
        "data-src", "data-original", "data-lazy-src", "data-image-src", "data-url"
      ], true);
      const currentSrc = image.getAttribute("src");
      if ((!isUsefulMediaUrl(currentSrc, true) || isPlaceholderImage(currentSrc)) && lazySrc) {
        image.setAttribute("src", lazySrc);
      }
      const lazySrcset = firstUsefulAttribute(image, ["data-srcset", "data-lazy-srcset"]);
      if (!image.getAttribute("srcset") && lazySrcset) image.setAttribute("srcset", lazySrcset);
    });

    sourceDocument.querySelectorAll("source").forEach((source) => {
      const lazySrc = firstUsefulAttribute(source, ["data-src", "data-lazy-src"]);
      const lazySrcset = firstUsefulAttribute(source, ["data-srcset", "data-lazy-srcset"]);
      if (!source.getAttribute("src") && lazySrc) source.setAttribute("src", lazySrc);
      if (!source.getAttribute("srcset") && lazySrcset) source.setAttribute("srcset", lazySrcset);
    });

    sourceDocument.querySelectorAll("video").forEach((video) => {
      const lazySrc = firstUsefulAttribute(video, ["data-src", "data-video-src", "data-lazy-src"]);
      const lazyPoster = firstUsefulAttribute(video, ["data-poster", "data-poster-url"], true);
      if (!video.getAttribute("src") && lazySrc) video.setAttribute("src", lazySrc);
      if (!video.getAttribute("poster") && lazyPoster) video.setAttribute("poster", lazyPoster);
    });
  }

  function firstUsefulAttribute(element, attributes, allowImageData = false) {
    for (const attribute of attributes) {
      const value = element.getAttribute(attribute)?.trim();
      if (isUsefulMediaUrl(value, allowImageData) && !isPlaceholderImage(value)) return value;
    }
    return "";
  }

  function isUsefulMediaUrl(value, allowImageData = false) {
    if (!value || /^(?:about:blank|javascript:|blob:)/i.test(value)) return false;
    return allowImageData ? !/^data:(?!image\/)/i.test(value) : !/^data:/i.test(value);
  }

  function isPlaceholderImage(value) {
    const source = value || "";
    return /^data:image\/(?:gif|png);base64,(?:R0lGODlhAQABA|iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB)/i.test(source)
      || /(?:^|[\/_-])(?:blank|spacer|transparent|placeholder)(?:[._-]|$)/i.test(source);
  }

  function resolveMediaUrl(value, baseUrl, allowImageData = false) {
    if (!isUsefulMediaUrl(value, allowImageData) || isPlaceholderImage(value)) return "";
    if (allowImageData && /^data:image\//i.test(value)) return value;
    const resolved = resolveUrl(value, baseUrl);
    return /^https?:/i.test(resolved) ? resolved : "";
  }

  function resolveSrcset(value, baseUrl) {
    if (!value) return "";
    return value.split(",").map((candidate) => {
      const parts = candidate.trim().split(/\s+/);
      const resolved = resolveMediaUrl(parts.shift(), baseUrl, true);
      return resolved ? [resolved, ...parts].join(" ") : "";
    }).filter(Boolean).join(", ");
  }

  function firstSrcsetUrl(value) {
    return value?.split(",")[0]?.trim().split(/\s+/)[0] || "";
  }

  function removeMediaPlayerControls(content) {
    const clusterRoots = [...content.querySelectorAll("div, section, figure")].filter((node) => {
      const text = normalizedText(node);
      if (!text || text.length > 700) return false;
      const signals = [
        /\bloaded:\s*\d+%/i,
        /\bprogress:\s*\d+%/i,
        /\bcurrent time\b/i,
        /\bduration time\b/i,
        /\bfull size\b/i,
        /\blive\b/i
      ];
      return signals.filter((pattern) => pattern.test(text)).length >= 3;
    });
    if (!clusterRoots.length) return;

    const controlText = /^(?:loaded:\s*\d+%|progress:\s*\d+%|current time(?:\s+\d{1,2}:\d{2})?|duration time(?:\s+\d{1,2}:\d{2})?|full size|live|\d{1,2}:\d{2}|\/)$/i;
    const candidates = [...content.querySelectorAll("p, div, span, li")].reverse();
    for (const node of candidates) {
      if (!clusterRoots.some((root) => root.contains(node))) continue;
      if (node.querySelector("img, picture, video")) continue;
      if (controlText.test(normalizedText(node))) node.remove();
    }
  }

  function normalizedText(node) {
    return node.textContent.replace(/\s+/g, " ").trim();
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
    image.loading = "eager";
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
    const metadata = [
      ["lr-author", data.byline],
      ["lr-published", formatDate(data.published)]
    ]
      .filter(([, value]) => Boolean(value))
      .map(([className, value]) => `<span class="${className}">${escapeHtml(value)}</span>`)
      .join("");

    window.stop();
    document.documentElement.innerHTML = `
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${safeTitle} — ${PRODUCT_NAME}</title>
        <style>${readerCss()}</style>
      </head>
      <body>
        <div id="${READER_ID}">
          <header class="lr-toolbar" aria-label="Reader controls">
            <button id="lr-original" type="button" title="${data.isSavedView ? "Open the original article" : "Reload the original article"}">← Original page</button>
            <div class="lr-tools">
              <details class="lr-settings">
                <summary>Reading style</summary>
                <div class="lr-settings-panel" aria-label="Typography and theme settings">
                  <label>
                    <span>Theme</span>
                    <select id="lr-theme" aria-label="Reading theme">
                      <option value="paper">Paper</option>
                      <option value="evening">Evening</option>
                      <option value="ambient">Ambient (automatic)</option>
                    </select>
                  </label>
                  <label>
                    <span>Typeface</span>
                    <select id="lr-font-family" aria-label="Article typeface">
                      <option value="editorial">Editorial</option>
                      <option value="book">Book</option>
                      <option value="modern">Modern</option>
                      <option value="accessible">Accessible</option>
                    </select>
                  </label>
                  <label>
                    <span>Text size <output id="lr-font-size-value">20px</output></span>
                    <input id="lr-font-size" type="range" min="16" max="28" step="1" value="20" aria-label="Article text size">
                  </label>
                  <label>
                    <span>Line spacing</span>
                    <select id="lr-line-height" aria-label="Article line spacing">
                      <option value="1.5">Compact</option>
                      <option value="1.72">Comfortable</option>
                      <option value="1.9">Relaxed</option>
                      <option value="2.1">Airy</option>
                    </select>
                  </label>
                  <label>
                    <span>Column width</span>
                    <select id="lr-column-width" aria-label="Article column width">
                      <option value="760">Narrow</option>
                      <option value="900">Balanced</option>
                      <option value="1040">Wide</option>
                    </select>
                  </label>
                  <button id="lr-style-reset" type="button">Reset style</button>
                </div>
              </details>
              <span id="lr-progress-label" class="lr-progress-label" aria-live="polite">${data.readingMinutes} min left</span>
              <label class="lr-speech-setting">
                <span>Speech</span>
                <select id="lr-speech-engine" aria-label="Read-aloud speech engine">
                  <option value="system">System</option>
                  <option value="kokoro">Natural (Kokoro)</option>
                </select>
              </label>
              <label class="lr-speech-setting">
                <span>Voice</span>
                <select id="lr-speech-voice" aria-label="Read-aloud voice" title="Voice changes apply from the next passage">
                  <option value="">System default</option>
                </select>
              </label>
              <label class="lr-speech-setting">
                <span>Speed</span>
                <select id="lr-speech-rate" aria-label="Read-aloud speed" title="Speed changes apply from the next passage">
                  <option value="0.75">0.75×</option>
                  <option value="1" selected>1×</option>
                  <option value="1.25">1.25×</option>
                  <option value="1.5">1.5×</option>
                  <option value="2">2×</option>
                </select>
              </label>
              <button id="lr-speech-toggle" type="button">Read aloud</button>
              <button id="lr-speech-stop" type="button" disabled>Stop</button>
              <button id="lr-save" type="button">${data.isSavedView ? "Saved ✓" : "Save article"}</button>
              <button id="lr-library" type="button">Library</button>
              <button id="lr-print" type="button">Print</button>
            </div>
            <div class="lr-progress-track" role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
              <div id="lr-progress-bar"></div>
            </div>
          </header>
          <main class="lr-page">
            <article>
              <p class="lr-kicker">${safeSiteName} · ${PRODUCT_NAME}</p>
              <h1>${safeTitle}</h1>
              ${safeDescription}
              <p class="lr-byline">${metadata}</p>
              <p class="lr-reading-meta">${data.wordCount.toLocaleString()} words · ${data.readingMinutes} min read</p>
              <div class="lr-rule"></div>
              <div id="lr-content">${data.content.innerHTML}</div>
              <footer>
                <a href="${escapeAttribute(data.sourceUrl)}">View the original article</a>
                <span>${data.paragraphCount} paragraphs · ${data.textLength.toLocaleString()} characters · ${escapeHtml(data.extractionMethod)}</span>
              </footer>
            </article>
          </main>
          <p id="lr-library-status" class="lr-speech-status" role="status" aria-live="polite" hidden></p>
          <p id="lr-speech-status" class="lr-speech-status" role="status" aria-live="polite" hidden></p>
          <dialog id="lr-kokoro-consent" class="lr-consent-dialog" aria-labelledby="lr-kokoro-consent-title">
            <form method="dialog">
              <h2 id="lr-kokoro-consent-title">Enable natural voices?</h2>
              <p>Textuary will download and cache an approximately 330 MB Kokoro voice model from Hugging Face. Speech is then generated on this device with WebGPU; article text is not uploaded.</p>
              <p class="lr-consent-note">The first passage may take a little while. System voices remain available at any time.</p>
              <div>
                <button value="cancel">Not now</button>
                <button value="enable" class="lr-primary">Enable natural voices</button>
              </div>
            </form>
          </dialog>
        </div>
      </body>`;

    document.getElementById("lr-original").addEventListener("click", () => {
      if (data.isSavedView) location.assign(data.sourceUrl);
      else location.reload();
    });
    document.getElementById("lr-print").addEventListener("click", () => window.print());
    setupLibraryControls(data);
    setupReadingExperience(data);
    setupReadAloud(data);
  }

  function setupLibraryControls(data) {
    const save = document.getElementById("lr-save");
    const open = document.getElementById("lr-library");
    const status = document.getElementById("lr-library-status");
    let noticeTimer = 0;

    if (data.isSavedView) save.disabled = true;
    else void reflectSavedState();

    save.addEventListener("click", async () => {
      save.disabled = true;
      save.textContent = "Saving…";
      try {
        const library = await loadLibrary();
        const normalizedUrl = normalizeArticleUrl(data.sourceUrl);
        const existing = library.articles.find((article) =>
          article.id === data.savedArticleId || normalizeArticleUrl(article.sourceUrl) === normalizedUrl
        );
        const now = Date.now();
        const progress = currentReadingRatio();
        const snapshot = {
          id: existing?.id || articleId(normalizedUrl),
          sourceUrl: data.sourceUrl,
          title: data.title,
          description: data.description || "",
          byline: data.byline || "",
          published: data.published || "",
          siteName: data.siteName || "",
          content: data.content.innerHTML,
          wordCount: data.wordCount,
          readingMinutes: data.readingMinutes,
          language: data.language || "",
          extractionMethod: data.extractionMethod || "",
          savedAt: existing?.savedAt || now,
          updatedAt: now,
          progress,
          read: progress >= .95
        };
        library.articles = library.articles.filter((article) => article.id !== snapshot.id);
        library.articles.push(snapshot);
        await saveLibrary(library);
        data.savedArticleId = snapshot.id;
        data.savedProgress = progress;
        save.textContent = "Saved ✓";
        setStatus("Saved locally. The clean article text is now available offline.");
      } catch (error) {
        save.disabled = false;
        save.textContent = "Save article";
        setStatus(`Could not save this article: ${safeStorageError(error)}`, true);
      }
    });

    open.addEventListener("click", async () => {
      const runtime = globalThis.browser?.runtime || globalThis.chrome?.runtime;
      if (!runtime) return;
      if (isSavedDocument) {
        location.assign(runtime.getURL("library.html"));
        return;
      }
      try {
        const response = await runtime.sendMessage({ type: "textuary-open-library" });
        if (response?.ok === false) throw new Error(response.error);
      } catch (error) {
        setStatus(`Could not open the Library: ${safeStorageError(error)}`, true);
      }
    });

    async function reflectSavedState() {
      try {
        const library = await loadLibrary();
        const normalizedUrl = normalizeArticleUrl(data.sourceUrl);
        const existing = library.articles.find((article) => normalizeArticleUrl(article.sourceUrl) === normalizedUrl);
        if (!existing) return;
        data.savedArticleId = existing.id;
        data.savedProgress = Number(existing.progress) || 0;
        save.textContent = "Update saved";
      } catch {
        // The explicit Save action will surface a useful storage error if needed.
      }
    }

    function setStatus(message, isError = false) {
      clearTimeout(noticeTimer);
      status.textContent = message;
      status.hidden = !message;
      status.dataset.error = String(isError);
      noticeTimer = setTimeout(() => { status.hidden = true; }, 5000);
    }
  }

  function setupReadingExperience(data) {
    const settings = document.querySelector(".lr-settings");
    const theme = document.getElementById("lr-theme");
    const fontFamily = document.getElementById("lr-font-family");
    const fontSize = document.getElementById("lr-font-size");
    const fontSizeValue = document.getElementById("lr-font-size-value");
    const lineHeight = document.getElementById("lr-line-height");
    const columnWidth = document.getElementById("lr-column-width");
    const reset = document.getElementById("lr-style-reset");
    const progress = document.querySelector(".lr-progress-track");
    const progressBar = document.getElementById("lr-progress-bar");
    const progressLabel = document.getElementById("lr-progress-label");
    const preferences = data.preferences;
    let progressFrame = 0;
    let progressSaveTimer = 0;

    applyPreferences(preferences);

    theme.addEventListener("change", updatePreferences);
    fontFamily.addEventListener("change", updatePreferences);
    fontSize.addEventListener("input", updatePreferences);
    lineHeight.addEventListener("change", updatePreferences);
    columnWidth.addEventListener("change", updatePreferences);
    reset.addEventListener("click", () => {
      const speechPreferences = {
        speechEngine: preferences.speechEngine,
        speechVoice: preferences.speechVoice,
        speechRate: preferences.speechRate,
        appleVoice: preferences.appleVoice,
        kokoroVoice: preferences.kokoroVoice,
        kokoroConsent: preferences.kokoroConsent
      };
      Object.assign(preferences, DEFAULT_PREFERENCES, speechPreferences);
      applyPreferences(preferences);
      void savePreferences(preferences);
      requestProgressUpdate();
    });

    document.addEventListener("click", (event) => {
      if (settings.open && !settings.contains(event.target)) settings.open = false;
    });
    settings.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        settings.open = false;
        settings.querySelector("summary").focus();
      }
    });

    const requestProgressUpdate = () => {
      if (progressFrame) return;
      progressFrame = requestAnimationFrame(() => {
        progressFrame = 0;
        const available = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        const rawRatio = Math.min(1, Math.max(0, scrollY / available));
        const ratio = rawRatio >= .95 ? 1 : rawRatio;
        const percentage = Math.round(ratio * 100);
        const minutesLeft = Math.max(0, Math.ceil(data.readingMinutes * (1 - ratio)));
        progressBar.style.width = `${percentage}%`;
        progress.setAttribute("aria-valuenow", String(percentage));
        progressLabel.textContent = percentage >= 100 ? "Finished" : `${minutesLeft} min left`;
        if (data.savedArticleId) {
          clearTimeout(progressSaveTimer);
          progressSaveTimer = setTimeout(() => void saveArticleProgress(data.savedArticleId, ratio), 650);
        }
      });
    };
    addEventListener("scroll", requestProgressUpdate, { passive: true });
    addEventListener("resize", requestProgressUpdate, { passive: true });
    requestProgressUpdate();
    if (data.isSavedView && data.savedProgress > 0) {
      const restore = () => {
        const available = Math.max(0, document.documentElement.scrollHeight - innerHeight);
        scrollTo(0, available * data.savedProgress);
        requestProgressUpdate();
      };
      setTimeout(restore, 120);
      setTimeout(restore, 900);
    }

    function updatePreferences() {
      Object.assign(preferences, {
        theme: theme.value,
        fontFamily: fontFamily.value,
        fontSize: Number(fontSize.value),
        lineHeight: Number(lineHeight.value),
        columnWidth: Number(columnWidth.value)
      });
      applyPreferences(preferences);
      void savePreferences(preferences);
      requestProgressUpdate();
    }

    function applyPreferences(next) {
      theme.value = next.theme;
      fontFamily.value = next.fontFamily;
      fontSize.value = String(next.fontSize);
      fontSizeValue.value = `${next.fontSize}px`;
      lineHeight.value = String(next.lineHeight);
      columnWidth.value = String(next.columnWidth);
      document.body.dataset.lrTheme = next.theme;
      document.body.dataset.lrAmbient = ambientPeriod();
      document.documentElement.style.setProperty("--lr-font-size", `${next.fontSize}px`);
      document.documentElement.style.setProperty("--lr-line-height", String(next.lineHeight));
      document.documentElement.style.setProperty("--lr-page-width", `${next.columnWidth}px`);
      document.documentElement.style.setProperty("--lr-reading-font", fontStack(next.fontFamily));
    }
  }

  function setupReadAloud(data) {
    const { language, preferences } = data;
    const toggle = document.getElementById("lr-speech-toggle");
    const stop = document.getElementById("lr-speech-stop");
    const engineSelect = document.getElementById("lr-speech-engine");
    const voiceSelect = document.getElementById("lr-speech-voice");
    const rateSelect = document.getElementById("lr-speech-rate");
    const status = document.getElementById("lr-speech-status");
    const consentDialog = document.getElementById("lr-kokoro-consent");
    const synth = globalThis.speechSynthesis;
    const Utterance = globalThis.SpeechSynthesisUtterance;
    const extensionApi = globalThis.browser ?? globalThis.chrome;
    const hasSystemSpeech = Boolean(synth && typeof Utterance === "function");
    const NaturalAudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
    const isSafari = /\bSafari\//.test(navigator.userAgent) &&
      !/\b(?:Chrome|HeadlessChrome|Chromium|CriOS|Edg|OPR)\//.test(navigator.userAgent);
    const hasAppleSpeech = Boolean(isSafari && extensionApi?.runtime?.sendMessage);
    const hasNaturalSpeech = Boolean(!isSafari && navigator.gpu && extensionApi?.runtime?.getURL && NaturalAudioContext);
    const chunks = buildSpeechChunks(data);
    const naturalOption = engineSelect.querySelector('option[value="kokoro"]');
    let voices = [];
    let state = "idle";
    let chunkIndex = 0;
    let session = 0;
    let highlightedElement = null;
    let naturalContext = null;
    let naturalSource = null;
    let kokoroPromise = null;
    let appleVoices = [];
    let appleVoicesLoaded = false;
    let appleVoicesPromise = null;
    let applePollTimer = null;
    let generationTail = Promise.resolve();
    const naturalCache = new Map();

    if (isSafari) {
      naturalOption.value = "apple";
      naturalOption.textContent = "Premium (Apple)";
      naturalOption.disabled = !hasAppleSpeech;
      naturalOption.title = hasAppleSpeech
        ? "Uses enhanced and premium voices installed on this Apple device"
        : "The Textuary Safari app is required for premium Apple voices";
    } else {
      naturalOption.disabled = !hasNaturalSpeech;
      naturalOption.title = hasNaturalSpeech
        ? "Runs locally using WebGPU"
        : "WebGPU is unavailable in this browser";
    }
    if (preferences.speechEngine === "kokoro" && !hasNaturalSpeech) preferences.speechEngine = "system";
    if (preferences.speechEngine === "apple" && !hasAppleSpeech) preferences.speechEngine = "system";
    if (!hasSystemSpeech && hasNaturalSpeech) preferences.speechEngine = "kokoro";
    if (!hasSystemSpeech && hasAppleSpeech) preferences.speechEngine = "apple";
    engineSelect.value = preferences.speechEngine;
    rateSelect.value = preferences.speechRate;

    engineSelect.addEventListener("change", () => {
      stopSpeaking();
      preferences.speechEngine = engineSelect.value;
      configureVoiceMenu();
      void savePreferences(preferences);
    });
    voiceSelect.addEventListener("change", () => {
      if (engineSelect.value === "kokoro") preferences.kokoroVoice = voiceSelect.value;
      else if (engineSelect.value === "apple") preferences.appleVoice = voiceSelect.value;
      else preferences.speechVoice = voiceSelect.value;
      clearNaturalCache(chunkIndex + 1);
      void savePreferences(preferences);
    });
    rateSelect.addEventListener("change", () => {
      preferences.speechRate = rateSelect.value;
      clearNaturalCache(chunkIndex + 1);
      void savePreferences(preferences);
    });

    toggle.addEventListener("click", () => void handleToggle().catch((error) => {
      stopSpeaking();
      showNotice(`Read-aloud control failed: ${naturalSpeechError(error)}.`);
    }));
    stop.addEventListener("click", stopSpeaking);
    window.addEventListener("pagehide", () => {
      stopSpeaking();
      void naturalContext?.close();
    }, { once: true });

    async function handleToggle() {
      if (state === "playing") {
        if (engineSelect.value === "apple") await sendAppleSpeech("pause");
        else if (engineSelect.value === "kokoro") await naturalContext?.suspend();
        else synth.pause();
        state = "paused";
        updateSpeechControls();
        return;
      }

      if (state === "paused") {
        if (engineSelect.value === "apple") await sendAppleSpeech("resume");
        else if (engineSelect.value === "kokoro") await naturalContext?.resume();
        else synth.resume();
        state = "playing";
        updateSpeechControls();
        return;
      }

      if (state !== "idle") return;
      if (!chunks.length) {
        showNotice(`${PRODUCT_NAME} could not find any text to read aloud.`);
        return;
      }

      session += 1;
      chunkIndex = 0;
      const activeSession = session;
      if (engineSelect.value === "apple") {
        await beginAppleSpeech(activeSession);
      } else if (engineSelect.value === "kokoro") {
        await beginNaturalSpeech(activeSession);
      } else {
        beginSystemSpeech(activeSession);
      }
    }

    function beginSystemSpeech(activeSession) {
      if (!hasSystemSpeech) {
        showNotice("System read-aloud is unavailable in this browser. Try Natural (Kokoro) instead.");
        return;
      }
      state = "playing";
      synth.cancel();
      if (synth.paused) synth.resume();
      updateSpeechControls();
      setTimeout(() => speakSystemNext(activeSession), 0);
    }

    async function beginAppleSpeech(activeSession) {
      if (!hasAppleSpeech) {
        fallBackToSystem("Premium Apple voices require the packaged Textuary Safari app. System voices remain available.");
        return;
      }

      state = "loading";
      setSpeechStatus("Finding installed Apple premium voices…");
      updateSpeechControls();
      try {
        await loadAppleVoices();
        if (activeSession !== session) return;
        if (!appleVoices.length) {
          throw new Error("No enhanced or premium Apple voices are installed");
        }
        await speakAppleNext(activeSession);
      } catch (error) {
        if (activeSession !== session) return;
        void sendAppleSpeech("stop").catch(() => {});
        finishSpeaking();
        fallBackToSystem(`Premium Apple speech could not start: ${naturalSpeechError(error)}. System voices remain available.`);
      }
    }

    async function speakAppleNext(activeSession) {
      if (activeSession !== session || state === "idle") return;
      if (chunkIndex >= chunks.length) {
        finishSpeaking();
        return;
      }

      const chunk = chunks[chunkIndex];
      const requestId = `${activeSession}-${chunkIndex}-${Date.now()}`;
      const selectedVoice = selectedAppleVoice();
      state = "loading";
      setSpeechStatus(`Starting ${selectedVoice?.name || "Apple premium voice"}…`);
      highlightSpokenElement(chunk.element);
      updateSpeechControls();

      const response = await sendAppleSpeech("speak", {
        requestId,
        text: chunk.text,
        voiceIdentifier: selectedVoice?.identifier || preferences.appleVoice,
        language: selectedVoice?.language || language || navigator.language || "en",
        rate: Number(rateSelect.value) || 1
      });
      if (activeSession !== session) return;
      if (response.requestId && response.requestId !== requestId) {
        throw new Error("The native speech bridge returned an unexpected passage identifier");
      }
      state = "playing";
      setSpeechStatus("");
      updateSpeechControls();
      scheduleAppleStatusPoll(activeSession, requestId);
    }

    function scheduleAppleStatusPoll(activeSession, requestId) {
      clearTimeout(applePollTimer);
      applePollTimer = setTimeout(async () => {
        if (activeSession !== session || state === "idle") return;
        try {
          const response = await sendAppleSpeech("status");
          if (activeSession !== session) return;
          if (response.requestId && response.requestId !== requestId) {
            throw new Error("The native speech bridge lost the current passage");
          }
          if (response.state === "finished") {
            chunkIndex += 1;
            await speakAppleNext(activeSession);
            return;
          }
          if (response.state === "idle" && state !== "paused") {
            throw new Error("The native speech process stopped unexpectedly");
          }
          scheduleAppleStatusPoll(activeSession, requestId);
        } catch (error) {
          if (activeSession !== session) return;
          void sendAppleSpeech("stop").catch(() => {});
          finishSpeaking();
          showNotice(`Premium Apple speech stopped: ${naturalSpeechError(error)}.`);
        }
      }, 180);
    }

    async function loadAppleVoices() {
      if (!appleVoicesPromise) {
        appleVoicesPromise = sendAppleSpeech("voices").then((response) => {
          const available = Array.isArray(response.voices) ? response.voices : [];
          const languagePrefix = String(language || navigator.language || "en").split("-")[0].toLowerCase();
          const matching = available.filter((voice) => String(voice.language || "").toLowerCase().startsWith(languagePrefix));
          appleVoices = (matching.length ? matching : available).filter((voice) => voice?.identifier && voice?.name);
          appleVoicesLoaded = true;
          if (engineSelect.value === "apple") configureVoiceMenu();
          return appleVoices;
        }).catch((error) => {
          appleVoicesPromise = null;
          throw error;
        });
      }
      return appleVoicesPromise;
    }

    async function sendAppleSpeech(command, payload = {}) {
      const response = await extensionApi.runtime.sendMessage({
        type: "textuary-native-speech",
        payload: { command, ...payload }
      });
      if (!response?.ok) throw new Error(response?.error || "The Textuary native speech bridge did not respond");
      return response;
    }

    async function beginNaturalSpeech(activeSession) {
      if (!hasNaturalSpeech) {
        fallBackToSystem(isSafari
          ? "Natural voices are temporarily unavailable in Safari because its current ONNX WebGPU runtime can hang. System voices remain available."
          : "Natural voices need WebGPU, which is unavailable here.");
        return;
      }

      await ensureNaturalAudioContext();
      if (!preferences.kokoroConsent && !await requestNaturalVoiceConsent()) {
        engineSelect.value = "system";
        preferences.speechEngine = "system";
        configureVoiceMenu();
        void savePreferences(preferences);
        return;
      }
      if (activeSession !== session) return;

      state = "loading";
      setSpeechStatus("Loading natural voice model…");
      updateSpeechControls();
      try {
        await loadKokoro();
        if (activeSession !== session) return;
        await naturalContext.resume();
        speakNaturalNext(activeSession);
      } catch (error) {
        console.error(`${PRODUCT_NAME} could not start Kokoro`, error);
        if (activeSession === session) {
          finishSpeaking();
          fallBackToSystem(`Natural voices could not start: ${naturalSpeechError(error)}. System voices are still available.`);
        }
      }
    }

    function speakSystemNext(activeSession) {
      if (activeSession !== session || state === "idle") return;
      if (chunkIndex >= chunks.length) {
        finishSpeaking();
        return;
      }

      const chunk = chunks[chunkIndex];
      highlightSpokenElement(chunk.element);
      const utterance = new Utterance(chunk.text);
      const selectedVoice = voices.find((candidate) => voiceKey(candidate) === voiceSelect.value);
      const languagePrefix = String(language || navigator.language || "").split("-")[0].toLowerCase();
      const voice = selectedVoice || voices.find((candidate) => candidate.default) ||
        voices.find((candidate) => candidate.lang?.toLowerCase().startsWith(languagePrefix));
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || language || navigator.language || "en";
      utterance.rate = Number(rateSelect.value) || 1;
      utterance.onend = () => {
        if (activeSession !== session) return;
        chunkIndex += 1;
        speakSystemNext(activeSession);
      };
      utterance.onerror = (event) => {
        if (activeSession !== session || /canceled|interrupted/.test(event.error || "")) return;
        finishSpeaking();
        showNotice("The browser could not read this article aloud with the selected system voice.");
      };
      synth.speak(utterance);
    }

    async function speakNaturalNext(activeSession) {
      if (activeSession !== session || state === "idle") return;
      if (chunkIndex >= chunks.length) {
        finishSpeaking();
        return;
      }

      state = "generating";
      setSpeechStatus(`Preparing ${naturalVoiceName()}…`);
      updateSpeechControls();
      try {
        const buffer = await generateNaturalBuffer(chunkIndex);
        if (activeSession !== session) return;
        highlightSpokenElement(chunks[chunkIndex].element);
        naturalSource = naturalContext.createBufferSource();
        naturalSource.buffer = buffer;
        naturalSource.connect(naturalContext.destination);
        naturalSource.addEventListener("ended", () => {
          if (activeSession !== session || state === "idle") return;
          naturalSource?.disconnect();
          naturalSource = null;
          chunkIndex += 1;
          pruneNaturalCache();
          void speakNaturalNext(activeSession);
        }, { once: true });
        naturalSource.start();
        state = "playing";
        setSpeechStatus("");
        updateSpeechControls();
        void generateNaturalBuffer(chunkIndex + 1).catch(() => {});
      } catch (error) {
        console.error(`${PRODUCT_NAME} could not generate natural speech`, error);
        if (activeSession !== session) return;
        finishSpeaking();
        showNotice("The natural voice could not generate this passage. Try a system voice or another natural voice.");
      }
    }

    async function loadKokoro() {
      if (!kokoroPromise) {
        kokoroPromise = (async () => {
          const adapter = await navigator.gpu.requestAdapter();
          if (!adapter) throw new Error("No WebGPU adapter is available");
          const moduleUrl = extensionApi.runtime.getURL("vendor/kokoro.web.js");
          const { KokoroTTS, env } = await import(moduleUrl);
          env.wasmPaths = extensionApi.runtime.getURL("vendor/");
          return KokoroTTS.from_pretrained(KOKORO_MODEL_ID, {
            dtype: "fp32",
            device: "webgpu",
            progress_callback: updateKokoroProgress
          });
        })().catch((error) => {
          kokoroPromise = null;
          throw error;
        });
      }
      return kokoroPromise;
    }

    function updateKokoroProgress(progress) {
      if (progress?.status !== "progress" || !Number.isFinite(progress.progress)) return;
      const file = String(progress.file || "");
      if (!/onnx|model/i.test(file)) return;
      setSpeechStatus(`Downloading natural voice model… ${Math.round(progress.progress)}%`);
    }

    function generateNaturalBuffer(index) {
      if (index >= chunks.length) return Promise.resolve(null);
      const key = naturalCacheKey(index);
      if (naturalCache.has(key)) return naturalCache.get(key);
      const voice = preferences.kokoroVoice;
      const speed = Number(rateSelect.value) || 1;

      const task = generationTail.catch(() => {}).then(async () => {
        const tts = await loadKokoro();
        const result = await tts.generate(chunks[index].text, {
          voice,
          speed
        });
        const buffer = naturalContext.createBuffer(1, result.audio.length, result.sampling_rate);
        buffer.copyToChannel(result.audio, 0);
        return buffer;
      });
      generationTail = task;
      naturalCache.set(key, task);
      task.catch(() => naturalCache.delete(key));
      return task;
    }

    function naturalCacheKey(index) {
      return `${index}:${preferences.kokoroVoice}:${rateSelect.value}`;
    }

    function clearNaturalCache(fromIndex = 0) {
      for (const key of naturalCache.keys()) {
        if (Number(key.split(":", 1)[0]) >= fromIndex) naturalCache.delete(key);
      }
    }

    function pruneNaturalCache() {
      for (const key of naturalCache.keys()) {
        const index = Number(key.split(":", 1)[0]);
        if (index < chunkIndex - 1 || index > chunkIndex + 5) naturalCache.delete(key);
      }
    }

    async function ensureNaturalAudioContext() {
      if (!naturalContext || naturalContext.state === "closed") {
        if (!NaturalAudioContext) throw new Error("Web Audio is unavailable");
        naturalContext = new NaturalAudioContext({ sampleRate: 24000 });
      }
      if (naturalContext.state === "suspended") await naturalContext.resume();
      return naturalContext;
    }

    function requestNaturalVoiceConsent() {
      return new Promise((resolve) => {
        const complete = () => {
          const accepted = consentDialog.returnValue === "enable";
          if (accepted) {
            preferences.kokoroConsent = true;
            void ensureNaturalAudioContext();
            void savePreferences(preferences);
          }
          resolve(accepted);
        };
        consentDialog.addEventListener("close", complete, { once: true });
        consentDialog.showModal();
      });
    }

    function stopSpeaking() {
      session += 1;
      clearTimeout(applePollTimer);
      applePollTimer = null;
      if (hasAppleSpeech) void sendAppleSpeech("stop").catch(() => {});
      synth?.cancel();
      if (synth?.paused) synth.resume();
      if (naturalSource) {
        naturalSource.onended = null;
        try { naturalSource.stop(); } catch {}
        naturalSource.disconnect();
        naturalSource = null;
      }
      void naturalContext?.suspend();
      chunkIndex = 0;
      state = "idle";
      setSpeechStatus("");
      highlightSpokenElement(null);
      updateSpeechControls();
    }

    function finishSpeaking() {
      clearTimeout(applePollTimer);
      applePollTimer = null;
      naturalSource = null;
      void naturalContext?.suspend();
      chunkIndex = 0;
      state = "idle";
      setSpeechStatus("");
      highlightSpokenElement(null);
      updateSpeechControls();
    }

    function fallBackToSystem(message) {
      if (hasSystemSpeech) {
        engineSelect.value = "system";
        preferences.speechEngine = "system";
        configureVoiceMenu();
        void savePreferences(preferences);
      }
      showNotice(message);
    }

    function updateSpeechControls() {
      toggle.textContent = ({
        playing: "Pause",
        paused: "Resume",
        loading: "Loading voice…",
        generating: "Preparing…"
      })[state] || "Read aloud";
      toggle.disabled = state === "loading" || state === "generating" || (!hasSystemSpeech && !hasNaturalSpeech && !hasAppleSpeech);
      toggle.setAttribute("aria-pressed", String(state !== "idle"));
      stop.disabled = state === "idle";
      engineSelect.disabled = state !== "idle";
    }

    function populateSystemVoices() {
      voices = [...(synth?.getVoices?.() || [])].sort((left, right) => {
        if (left.default !== right.default) return left.default ? -1 : 1;
        const languagePrefix = String(language || "").split("-")[0].toLowerCase();
        const leftMatches = languagePrefix && left.lang?.toLowerCase().startsWith(languagePrefix);
        const rightMatches = languagePrefix && right.lang?.toLowerCase().startsWith(languagePrefix);
        if (leftMatches !== rightMatches) return leftMatches ? -1 : 1;
        return left.name.localeCompare(right.name);
      });
      if (engineSelect.value === "system") configureVoiceMenu();
    }

    function configureVoiceMenu() {
      if (engineSelect.value === "apple") {
        if (!appleVoicesLoaded) {
          voiceSelect.replaceChildren(new Option("Loading premium voices…", ""));
          voiceSelect.disabled = true;
          voiceSelect.title = "Textuary is asking the native Apple speech engine for installed premium voices";
          void loadAppleVoices().catch((error) => {
            voiceSelect.replaceChildren(new Option("Premium voices unavailable", ""));
            voiceSelect.disabled = true;
            showNotice(`Textuary could not list Apple premium voices: ${naturalSpeechError(error)}.`);
          });
          return;
        }
        if (!appleVoices.length) {
          voiceSelect.replaceChildren(new Option("No premium voices installed", ""));
          voiceSelect.disabled = true;
          voiceSelect.title = "Install an enhanced or premium voice in Accessibility > Read & Speak";
          return;
        }
        voiceSelect.replaceChildren(...appleVoices.map((voice) =>
          new Option(`${voice.name} (${voice.quality}, ${voice.language})`, voice.identifier)
        ));
        const selected = appleVoices.some(({ identifier }) => identifier === preferences.appleVoice)
          ? preferences.appleVoice
          : appleVoices[0].identifier;
        voiceSelect.value = selected;
        preferences.appleVoice = selected;
        voiceSelect.disabled = false;
        voiceSelect.title = "Enhanced and premium voices installed on this Apple device";
        return;
      }
      if (engineSelect.value === "kokoro") {
        voiceSelect.replaceChildren(...KOKORO_VOICES.map(([id, name, accent, gender]) =>
          new Option(`${name} (${accent}, ${gender})`, id)
        ));
        voiceSelect.value = KOKORO_VOICES.some(([id]) => id === preferences.kokoroVoice)
          ? preferences.kokoroVoice
          : DEFAULT_PREFERENCES.kokoroVoice;
        voiceSelect.disabled = !hasNaturalSpeech;
        voiceSelect.title = "Natural voices are generated locally; changes apply from the next passage";
        return;
      }

      voiceSelect.replaceChildren(new Option("System default", ""));
      for (const voice of voices) {
        const suffix = [voice.lang, voice.default ? "default" : ""].filter(Boolean).join(", ");
        voiceSelect.append(new Option(`${voice.name}${suffix ? ` (${suffix})` : ""}`, voiceKey(voice)));
      }
      if ([...voiceSelect.options].some((option) => option.value === preferences.speechVoice)) {
        voiceSelect.value = preferences.speechVoice;
      }
      voiceSelect.disabled = !hasSystemSpeech || voices.length === 0;
      voiceSelect.title = "System voices are supplied by the browser and operating system";
    }

    function naturalVoiceName() {
      return KOKORO_VOICES.find(([id]) => id === preferences.kokoroVoice)?.[1] || "natural voice";
    }

    function selectedAppleVoice() {
      return appleVoices.find(({ identifier }) => identifier === voiceSelect.value) || appleVoices[0] || null;
    }

    function setSpeechStatus(message) {
      status.textContent = message;
      status.hidden = !message;
    }

    function naturalSpeechError(error) {
      const message = String(error?.message || error || "unknown error")
        .replace(/chrome-extension:\/\/[a-z]+\//gi, "the packaged extension/")
        .replace(/https?:\/\/[^\s)]+/gi, "the model server")
        .replace(/\s+/g, " ")
        .trim();
      return (message || "unknown error").slice(0, 180);
    }

    populateSystemVoices();
    configureVoiceMenu();
    if (typeof synth?.addEventListener === "function") synth.addEventListener("voiceschanged", populateSystemVoices);
    else if (synth) synth.onvoiceschanged = populateSystemVoices;
    updateSpeechControls();

    function highlightSpokenElement(element) {
      if (highlightedElement === element) return;
      highlightedElement?.classList.remove("lr-speaking");
      highlightedElement?.removeAttribute("aria-current");
      highlightedElement = element;
      if (!element) return;
      element.classList.add("lr-speaking");
      element.setAttribute("aria-current", "true");
      const bounds = element.getBoundingClientRect();
      if (bounds.top < 80 || bounds.bottom > innerHeight - 40) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function voiceKey(voice) {
    return voice.voiceURI || `${voice.name}\u0000${voice.lang}`;
  }

  function buildSpeechChunks(data = {}) {
    const headerElements = [
      document.querySelector("h1"),
      document.querySelector(".lr-author"),
      document.querySelector(".lr-published"),
      document.querySelector(".lr-standfirst")
    ].filter(Boolean);
    const contentSelectors = [
      "#lr-content h2",
      "#lr-content h3",
      "#lr-content h4",
      "#lr-content h5",
      "#lr-content h6",
      "#lr-content p",
      "#lr-content li",
      "#lr-content figcaption"
    ].join(",");
    const readableElements = [...headerElements, ...document.querySelectorAll(contentSelectors)]
      .filter((element) => !element.querySelector("p, li, h2, h3, h4, h5, h6"));
    return readableElements.flatMap((element) => splitForSpeech(
      speechTextForElement(element, data)
    ).map((text) => ({ text, element })));
  }

  function speechTextForElement(element, data) {
    const text = element.textContent.replace(/\s+/g, " ").trim();
    if (element.classList.contains("lr-author")) {
      return /^by\b/i.test(text) ? text : `By ${text}`;
    }
    if (element.classList.contains("lr-published")) return `Published ${text}`;
    return text || data.title || "";
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

  function countWords(text, language) {
    const normalized = String(text || "").replace(/\s+/g, " ").trim();
    if (!normalized) return 0;
    if (typeof Intl.Segmenter === "function") {
      return [...new Intl.Segmenter(language || undefined, { granularity: "word" }).segment(normalized)]
        .filter(({ isWordLike }) => isWordLike).length;
    }
    return normalized.match(/\p{L}[\p{L}\p{M}\p{N}’'-]*/gu)?.length || normalized.split(" ").length;
  }

  async function loadLibrary() {
    const storage = extensionStorage();
    if (!storage) return { version: 1, articles: [] };
    const result = await storage.get(LIBRARY_KEY);
    const articles = Array.isArray(result?.[LIBRARY_KEY]?.articles)
      ? result[LIBRARY_KEY].articles.filter((article) =>
        article && typeof article.id === "string" && typeof article.content === "string"
      )
      : [];
    return { version: 1, articles };
  }

  async function saveLibrary(library) {
    const storage = extensionStorage();
    if (!storage) throw new Error("local extension storage is unavailable");
    await storage.set({
      [LIBRARY_KEY]: {
        version: 1,
        articles: Array.isArray(library?.articles) ? library.articles : []
      }
    });
  }

  async function saveArticleProgress(id, progress) {
    try {
      const library = await loadLibrary();
      const article = library.articles.find((candidate) => candidate.id === id);
      if (!article) return;
      const normalized = Math.max(0, Math.min(1, Number(progress) || 0));
      if (Math.abs((Number(article.progress) || 0) - normalized) < .01 && article.read === (normalized >= .95)) return;
      article.progress = normalized;
      article.read = normalized >= .95;
      article.lastReadAt = Date.now();
      await saveLibrary(library);
    } catch (error) {
      console.info(`${PRODUCT_NAME} could not save reading progress`, error);
    }
  }

  function currentReadingRatio() {
    const available = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const ratio = Math.min(1, Math.max(0, scrollY / available));
    return ratio >= .95 ? 1 : ratio;
  }

  function normalizeArticleUrl(value) {
    try {
      const url = new URL(value);
      url.hash = "";
      return url.href;
    } catch {
      return String(value || "").split("#")[0];
    }
  }

  function articleId(value) {
    let hash = 2166136261;
    for (const character of String(value || "")) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return `article-${(hash >>> 0).toString(36)}`;
  }

  function safeStorageError(error) {
    return String(error?.message || error || "unknown error")
      .replace(/chrome-extension:\/\/[a-z]+\//gi, "the extension/")
      .replace(/safari-web-extension:\/\/[a-z0-9.-]+\//gi, "the extension/")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
  }

  async function loadPreferences() {
    const storage = extensionStorage();
    if (!storage) return { ...DEFAULT_PREFERENCES };
    try {
      const result = await storage.get(PREFERENCES_KEY);
      return normalizePreferences(result?.[PREFERENCES_KEY]);
    } catch (error) {
      console.info(`${PRODUCT_NAME} could not load reading preferences`, error);
      return { ...DEFAULT_PREFERENCES };
    }
  }

  async function savePreferences(preferences) {
    const storage = extensionStorage();
    if (!storage) return;
    try {
      await storage.set({ [PREFERENCES_KEY]: normalizePreferences(preferences) });
    } catch (error) {
      console.info(`${PRODUCT_NAME} could not save reading preferences`, error);
    }
  }

  function extensionStorage() {
    return globalThis.browser?.storage?.local || globalThis.chrome?.storage?.local || null;
  }

  function normalizePreferences(value = {}) {
    const enumValue = (candidate, allowed, fallback) => allowed.includes(candidate) ? candidate : fallback;
    const numberValue = (candidate, allowed, fallback) => allowed.includes(Number(candidate)) ? Number(candidate) : fallback;
    return {
      theme: enumValue(value.theme, ["paper", "evening", "ambient"], DEFAULT_PREFERENCES.theme),
      fontFamily: enumValue(value.fontFamily, ["editorial", "book", "modern", "accessible"], DEFAULT_PREFERENCES.fontFamily),
      fontSize: Math.min(28, Math.max(16, Number(value.fontSize) || DEFAULT_PREFERENCES.fontSize)),
      lineHeight: numberValue(value.lineHeight, [1.5, 1.72, 1.9, 2.1], DEFAULT_PREFERENCES.lineHeight),
      columnWidth: numberValue(value.columnWidth, [760, 900, 1040], DEFAULT_PREFERENCES.columnWidth),
      speechEngine: enumValue(value.speechEngine, ["system", "kokoro", "apple"], DEFAULT_PREFERENCES.speechEngine),
      speechVoice: typeof value.speechVoice === "string" ? value.speechVoice : DEFAULT_PREFERENCES.speechVoice,
      speechRate: enumValue(String(value.speechRate || ""), ["0.75", "1", "1.25", "1.5", "2"], DEFAULT_PREFERENCES.speechRate),
      appleVoice: typeof value.appleVoice === "string" ? value.appleVoice : DEFAULT_PREFERENCES.appleVoice,
      kokoroVoice: KOKORO_VOICES.some(([id]) => id === value.kokoroVoice)
        ? value.kokoroVoice
        : DEFAULT_PREFERENCES.kokoroVoice,
      kokoroConsent: value.kokoroConsent === true
    };
  }

  function fontStack(family) {
    return ({
      editorial: "Georgia, 'Times New Roman', serif",
      book: "Iowan Old Style, Palatino Linotype, Book Antiqua, Palatino, serif",
      modern: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      accessible: "Atkinson Hyperlegible, Arial, Verdana, sans-serif"
    })[family] || "Georgia, 'Times New Roman', serif";
  }

  function ambientPeriod() {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 7 ? "evening" : "day";
  }

  function chooseBestTitle(articleTitle, alternativeTitles, siteName, sourceUrl) {
    const baseline = cleanTitleCandidate(articleTitle, siteName, sourceUrl);
    const baselineTokens = titleTokens(baseline);
    const candidates = [baseline, ...alternativeTitles]
      .map((title) => cleanTitleCandidate(title, siteName, sourceUrl))
      .filter((title, index, titles) =>
        title.length >= 12 && title.length <= 240 && titles.indexOf(title) === index
      );

    const credible = candidates.filter((candidate) => {
      if (!baseline || candidate === baseline) return true;
      const candidateTokens = titleTokens(candidate);
      const shared = [...baselineTokens].filter((token) => candidateTokens.has(token)).length;
      const overlap = shared / Math.max(1, Math.min(baselineTokens.size, candidateTokens.size));
      return overlap >= 0.6 && candidate.length <= baseline.length + 160;
    });

    return credible.sort((left, right) => right.length - left.length)[0]
      || baseline
      || candidates[0]
      || "Article";
  }

  function cleanTitleCandidate(value, siteName, sourceUrl) {
    let title = String(value || "").replace(/\s+/g, " ").trim();
    if (!title) return "";
    const siteTokens = titleTokens(`${siteName || ""} ${hostnameLabel(sourceUrl).replace(/\.[a-z]{2,}$/i, "")}`);
    const separator = /\s(?:\||—|–|-)\s/g;
    const matches = [...title.matchAll(separator)];
    const last = matches.at(-1);
    if (last) {
      const suffix = title.slice(last.index + last[0].length).trim();
      const suffixTokens = titleTokens(suffix);
      const shared = [...suffixTokens].filter((token) => siteTokens.has(token)).length;
      if (suffixTokens.size && shared / suffixTokens.size >= 0.6) {
        title = title.slice(0, last.index).trim();
      }
    }
    return title;
  }

  function titleTokens(value) {
    return new Set(String(value || "").toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter((word) => word.length > 2) || []);
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
      :root { color-scheme: light; --lr-font-size: 20px; --lr-line-height: 1.72; --lr-page-width: 1040px; --lr-reading-font: Georgia, 'Times New Roman', serif; --lr-bg: #f4efe5; --lr-paper: #fffdf8; --lr-text: #24211e; --lr-muted: #6b625b; --lr-line: #ded7cf; --lr-accent: #0d4a86; }
      * { box-sizing: border-box; }
      html { background: var(--lr-bg); scroll-behavior: smooth; }
      body { margin: 0; background: var(--lr-bg); color: var(--lr-text); font-family: var(--lr-reading-font); transition: background-color .2s ease, color .2s ease; }
      body[data-lr-theme="evening"], body[data-lr-theme="ambient"][data-lr-ambient="evening"] { color-scheme: dark; --lr-bg: #171817; --lr-paper: #222320; --lr-text: #eee6d8; --lr-muted: #b4aa9b; --lr-line: #41413b; --lr-accent: #e9b872; }
      body[data-lr-theme="ambient"][data-lr-ambient="day"] { --lr-bg: #e8efea; --lr-paper: #fcfdf9; --lr-text: #1f2924; --lr-muted: #68746d; --lr-line: #d0dbd3; --lr-accent: #2d6e55; }
      body[data-lr-theme="ambient"] { background-image: radial-gradient(circle at 12% 8%, color-mix(in srgb, var(--lr-accent) 9%, transparent), transparent 32rem); background-attachment: fixed; }
      .lr-toolbar { position: sticky; top: 0; z-index: 10; display: flex; justify-content: space-between; gap: 12px; padding: 10px max(16px, calc((100vw - 1480px) / 2)); border-bottom: 1px solid var(--lr-line); background: var(--lr-paper); background: color-mix(in srgb, var(--lr-paper) 94%, transparent); backdrop-filter: blur(10px); font: 14px/1.2 system-ui, sans-serif; }
      .lr-toolbar button { min-height: 36px; padding: 7px 11px; border: 1px solid var(--lr-line); border-radius: 7px; background: var(--lr-paper); color: var(--lr-text); cursor: pointer; white-space: nowrap; }
      .lr-toolbar button:hover:not(:disabled) { border-color: var(--lr-accent); color: var(--lr-accent); }
      .lr-toolbar button:disabled { cursor: default; opacity: .45; }
      .lr-toolbar select { min-height: 36px; padding: 6px 28px 6px 8px; border: 1px solid var(--lr-line); border-radius: 7px; background: var(--lr-paper); color: var(--lr-text); font: inherit; }
      .lr-toolbar select:focus { border-color: var(--lr-accent); outline: 2px solid color-mix(in srgb, var(--lr-accent) 30%, transparent); outline-offset: 1px; }
      #lr-speech-toggle[aria-pressed="true"] { border-color: var(--lr-accent); color: var(--lr-accent); }
      .lr-tools { display: flex; flex-wrap: nowrap; align-items: center; justify-content: flex-end; gap: 6px; }
      .lr-speech-setting { display: flex; align-items: center; gap: 5px; color: var(--lr-muted); font-size: 12px; }
      #lr-speech-engine { width: 150px; }
      #lr-speech-voice { width: min(190px, 24vw); }
      #lr-speech-rate { width: 76px; }
      .lr-settings { position: relative; }
      .lr-settings > summary { min-height: 36px; padding: 9px 11px 7px; border: 1px solid var(--lr-line); border-radius: 7px; background: var(--lr-paper); color: var(--lr-text); cursor: pointer; list-style: none; white-space: nowrap; }
      .lr-settings > summary::-webkit-details-marker { display: none; }
      .lr-settings > summary::after { content: " ▾"; color: var(--lr-muted); }
      .lr-settings[open] > summary { border-color: var(--lr-accent); color: var(--lr-accent); }
      .lr-settings-panel { position: absolute; top: calc(100% + 10px); right: 0; display: grid; width: 300px; gap: 13px; padding: 18px; border: 1px solid var(--lr-line); border-radius: 10px; background: var(--lr-paper); box-shadow: 0 18px 50px rgba(0, 0, 0, .18); }
      .lr-settings-panel label { display: grid; gap: 6px; color: var(--lr-muted); font-size: 12px; }
      .lr-settings-panel label > span { display: flex; justify-content: space-between; }
      .lr-settings-panel select, .lr-settings-panel input { width: 100%; }
      .lr-settings-panel output { color: var(--lr-text); }
      .lr-settings-panel button { justify-self: start; }
      .lr-progress-label { min-width: 64px; color: var(--lr-muted); font-size: 12px; text-align: center; white-space: nowrap; }
      .lr-progress-track { position: absolute; right: 0; bottom: -1px; left: 0; height: 3px; overflow: hidden; background: transparent; }
      #lr-progress-bar { width: 0; height: 100%; background: var(--lr-accent); transition: width .12s linear; }
      .lr-speech-status { position: fixed; z-index: 11; top: 66px; right: max(18px, calc((100vw - 1240px) / 2)); max-width: min(430px, calc(100vw - 36px)); margin: 0; padding: 9px 13px; border: 1px solid var(--lr-line); border-radius: 8px; background: var(--lr-paper); color: var(--lr-muted); box-shadow: 0 8px 28px rgba(0, 0, 0, .15); font: 12px/1.4 system-ui, sans-serif; }
      #lr-library-status { top: 108px; }
      .lr-consent-dialog { width: min(520px, calc(100vw - 36px)); padding: 0; border: 1px solid var(--lr-line); border-radius: 12px; background: var(--lr-paper); color: var(--lr-text); box-shadow: 0 24px 80px rgba(0, 0, 0, .28); }
      .lr-consent-dialog::backdrop { background: rgba(12, 16, 20, .55); backdrop-filter: blur(3px); }
      .lr-consent-dialog form { padding: 26px; font: 15px/1.55 system-ui, sans-serif; }
      .lr-consent-dialog h2 { margin: 0 0 12px; font: 700 24px/1.2 system-ui, sans-serif; }
      .lr-consent-dialog p { margin: 0 0 13px; }
      .lr-consent-dialog .lr-consent-note { color: var(--lr-muted); font-size: 13px; }
      .lr-consent-dialog form > div { display: flex; justify-content: flex-end; gap: 9px; margin-top: 22px; }
      .lr-consent-dialog button { min-height: 38px; padding: 8px 13px; border: 1px solid var(--lr-line); border-radius: 7px; background: var(--lr-paper); color: var(--lr-text); cursor: pointer; }
      .lr-consent-dialog button.lr-primary { border-color: var(--lr-accent); background: var(--lr-accent); color: white; }
      .lr-page { width: min(100%, var(--lr-page-width)); margin: 0 auto; padding: 36px 24px 80px; transition: width .2s ease; }
      .lr-page > article { padding: clamp(26px, 6vw, 68px); border: 1px solid var(--lr-line); border-radius: 3px; background: var(--lr-paper); box-shadow: 0 18px 50px rgba(53, 43, 32, .08); }
      .lr-kicker { margin: 0 0 14px; color: var(--lr-accent); font: 700 12px/1.2 system-ui, sans-serif; letter-spacing: .12em; text-transform: uppercase; }
      h1 { margin: 0; font-size: clamp(34px, 6vw, 56px); font-weight: 700; line-height: 1.04; letter-spacing: -.035em; text-wrap: balance; }
      .lr-standfirst { margin: 24px 0 0; color: var(--lr-muted); font-size: clamp(20px, 3vw, 25px); line-height: 1.42; }
      .lr-byline { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 24px 0 0; color: var(--lr-muted); font: 13px/1.5 system-ui, sans-serif; }
      .lr-reading-meta { margin: 7px 0 0; color: var(--lr-muted); font: 12px/1.5 system-ui, sans-serif; }
      .lr-rule { width: 72px; height: 3px; margin: 28px 0 34px; background: var(--lr-accent); }
      #lr-content { overflow-wrap: anywhere; }
      #lr-content p, #lr-content li { font-size: var(--lr-font-size); line-height: var(--lr-line-height); }
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
      #lr-content video { display: block; width: 100%; max-height: 760px; margin: 2em auto; background: #111; }
      #lr-content figcaption { margin-top: -1.5em; color: var(--lr-muted); font: 12px/1.45 system-ui, sans-serif; }
      #lr-content video + figcaption { margin-top: .7em; }
      #lr-content .lr-speaking, h1.lr-speaking, .lr-standfirst.lr-speaking, .lr-byline .lr-speaking { border-radius: 4px; background: color-mix(in srgb, var(--lr-accent) 14%, transparent); box-shadow: 0 0 0 5px color-mix(in srgb, var(--lr-accent) 14%, transparent); transition: background .18s ease, box-shadow .18s ease; }
      footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-top: 48px; padding-top: 18px; border-top: 1px solid var(--lr-line); color: var(--lr-muted); font: 12px/1.5 system-ui, sans-serif; }
      @media (max-width: 1320px) { .lr-progress-label, .lr-speech-setting > span { display: none; } #lr-speech-engine { width: 116px; } #lr-speech-voice { width: min(160px, 22vw); } }
      @media (max-width: 700px) { .lr-toolbar { align-items: flex-start; } .lr-tools { flex-wrap: wrap; } .lr-page { padding: 0; } .lr-page > article { border: 0; padding: 34px 20px 60px; } #lr-speech-engine { width: 116px; } #lr-speech-voice { width: min(150px, 38vw); } .lr-settings-panel { position: fixed; top: 60px; right: 12px; left: 12px; width: auto; } }
      @media print { .lr-toolbar { display: none; } html, body, .lr-page, .lr-page > article { background: white; color: black; } .lr-page { width: 100%; padding: 0; } .lr-page > article { border: 0; box-shadow: none; padding: 0; } }
    `;
  }
})();
