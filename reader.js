(() => {
  "use strict";

  const READER_ID = "dm-reader-view";
  if (document.getElementById(READER_ID)) {
    location.reload();
    return;
  }

  const article = document.querySelector("#js-article-text, article .article-text, .article-text");
  if (!article) {
    showNotice("Daily Mail Reader could not find an article on this page.");
    return;
  }

  const title = firstText([
    'meta[property="mol:headline"]',
    'meta[property="og:title"]',
    "h1"
  ], true) || document.title.replace(/\s*\|\s*Daily Mail Online\s*$/i, "");

  const description = firstText([
    'meta[name="description"]',
    'meta[property="og:description"]'
  ], true);

  const byline = uniqueTexts(article.querySelectorAll(
    ".byline-plain, .byline-fancy, .byline-section"
  )).join(" · ");

  const published = firstText([
    ".article-timestamp",
    "time"
  ]);

  const content = extractContent(article);
  const paragraphCount = content.querySelectorAll("p").length;
  if (paragraphCount < 2) {
    showNotice("Daily Mail Reader found the page, but the article text has not loaded yet. Try again in a moment.");
    return;
  }

  const sourceUrl = location.href;
  const safeTitle = escapeHtml(title);
  const safeDescription = description && description !== title
    ? `<p class="dm-standfirst">${escapeHtml(description)}</p>`
    : "";
  const safeByline = byline ? `<span>${escapeHtml(byline)}</span>` : "";
  const safePublished = published ? `<span>${escapeHtml(published)}</span>` : "";

  window.stop();
  document.documentElement.innerHTML = `
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${safeTitle} — Reader</title>
      <style>${readerCss()}</style>
    </head>
    <body>
      <div id="${READER_ID}">
        <header class="dm-toolbar" aria-label="Reader controls">
          <button id="dm-original" type="button" title="Reload the original article">← Original page</button>
          <div class="dm-tools">
            <button id="dm-smaller" type="button" aria-label="Decrease text size">A−</button>
            <button id="dm-larger" type="button" aria-label="Increase text size">A+</button>
            <button id="dm-theme" type="button" aria-label="Switch colour theme">Dark</button>
            <button id="dm-print" type="button">Print</button>
          </div>
        </header>
        <main class="dm-page">
          <article>
            <p class="dm-kicker">Daily Mail · Reader view</p>
            <h1>${safeTitle}</h1>
            ${safeDescription}
            <p class="dm-byline">${safeByline}${safePublished}</p>
            <div class="dm-rule"></div>
            <div id="dm-content">${content.innerHTML}</div>
            <footer>
              <a href="${escapeAttribute(sourceUrl)}">View the original article</a>
              <span>${paragraphCount} paragraphs extracted locally from this page</span>
            </footer>
          </article>
        </main>
      </div>
    </body>`;

  document.getElementById("dm-original").addEventListener("click", () => location.reload());
  document.getElementById("dm-print").addEventListener("click", () => window.print());

  let fontSize = 20;
  document.getElementById("dm-smaller").addEventListener("click", () => {
    fontSize = Math.max(16, fontSize - 1);
    document.documentElement.style.setProperty("--dm-font-size", `${fontSize}px`);
  });
  document.getElementById("dm-larger").addEventListener("click", () => {
    fontSize = Math.min(28, fontSize + 1);
    document.documentElement.style.setProperty("--dm-font-size", `${fontSize}px`);
  });

  document.getElementById("dm-theme").addEventListener("click", (event) => {
    const isDark = document.body.classList.toggle("dm-dark");
    event.currentTarget.textContent = isDark ? "Light" : "Dark";
  });

  function extractContent(source) {
    const output = document.createElement("div");
    const seenText = new Set();
    const seenImages = new Set();
    const candidates = source.querySelectorAll(
      "p.mol-para-with-font, h2, h3, .artSplitter"
    );

    for (const node of candidates) {
      if (isExcluded(node)) continue;
      if (node.matches("p, h2, h3") && node.closest(".artSplitter")) continue;

      if (node.matches(".artSplitter")) {
        const image = node.querySelector("img");
        if (!image) continue;
        const src = image.currentSrc || image.src || image.dataset.src || image.dataset.original;
        if (!src || seenImages.has(src)) continue;
        seenImages.add(src);

        const figure = document.createElement("figure");
        const cleanImage = document.createElement("img");
        cleanImage.src = src;
        cleanImage.alt = image.alt || "";
        cleanImage.loading = "lazy";
        cleanImage.referrerPolicy = "no-referrer-when-downgrade";
        figure.append(cleanImage);

        const captionText = node.querySelector(
          ".imageCaption, .image-caption, figcaption, .caption"
        )?.textContent?.trim();
        if (captionText) {
          const caption = document.createElement("figcaption");
          caption.textContent = captionText;
          figure.append(caption);
        }
        output.append(figure);
        continue;
      }

      const text = node.textContent.replace(/\s+/g, " ").trim();
      if (!text || seenText.has(text)) continue;
      if (/^(advertisement|read more|share or comment)$/i.test(text)) continue;
      if (/^Daily Mail journalists select and curate the products/i.test(text)) continue;
      seenText.add(text);

      const element = document.createElement(
        node.matches("h2, h3, .mol-style-subhead") ? "h2" : "p"
      );
      appendCleanInline(node, element);
      output.append(element);
    }
    return output;
  }

  function appendCleanInline(source, destination) {
    const allowed = source.querySelectorAll("a, strong, b, em, i");
    if (!allowed.length) {
      destination.textContent = source.textContent.replace(/\s+/g, " ").trim();
      return;
    }

    const clone = source.cloneNode(true);
    clone.querySelectorAll("script, style, button, svg, img").forEach((node) => node.remove());
    clone.querySelectorAll("*").forEach((node) => {
      if (!["A", "STRONG", "B", "EM", "I", "BR"].includes(node.tagName)) {
        node.replaceWith(...node.childNodes);
        return;
      }
      [...node.attributes].forEach((attribute) => {
        if (!(node.tagName === "A" && attribute.name === "href")) {
          node.removeAttribute(attribute.name);
        }
      });
      if (node.tagName === "A") {
        const href = node.getAttribute("href") || "";
        if (!/^(https?:|\/)/i.test(href)) node.removeAttribute("href");
        node.target = "_blank";
        node.rel = "noopener noreferrer";
      }
    });
    destination.append(...clone.childNodes);
  }

  function isExcluded(node) {
    return Boolean(node.closest([
      ".mol-products-module",
      ".mol-product",
      ".related-articles",
      ".shareArticles",
      ".linkButtonRow",
      ".adHolder",
      ".advert",
      "[id^='taboola']",
      "[data-ad-marker]"
    ].join(",")));
  }

  function firstText(selectors, metadata = false) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const value = metadata ? node?.content : node?.textContent;
      if (value?.trim()) return value.replace(/\s+/g, " ").trim();
    }
    return "";
  }

  function uniqueTexts(nodes) {
    return [...new Set([...nodes]
      .map((node) => node.textContent.replace(/\s+/g, " ").trim())
      .filter(Boolean))];
  }

  function showNotice(message) {
    const oldNotice = document.getElementById("dm-reader-notice");
    if (oldNotice) oldNotice.remove();
    const notice = document.createElement("div");
    notice.id = "dm-reader-notice";
    notice.textContent = message;
    Object.assign(notice.style, {
      position: "fixed",
      zIndex: "2147483647",
      top: "18px",
      left: "50%",
      transform: "translateX(-50%)",
      maxWidth: "520px",
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
      :root { color-scheme: light; --dm-font-size: 20px; --dm-bg: #f7f4ee; --dm-paper: #fff; --dm-text: #24211e; --dm-muted: #6b625b; --dm-line: #ded7cf; --dm-accent: #0d4a86; }
      * { box-sizing: border-box; }
      html { background: var(--dm-bg); scroll-behavior: smooth; }
      body { margin: 0; background: var(--dm-bg); color: var(--dm-text); font-family: Georgia, 'Times New Roman', serif; }
      body.dm-dark { color-scheme: dark; --dm-bg: #16191d; --dm-paper: #20242a; --dm-text: #e9e4dc; --dm-muted: #aaa39a; --dm-line: #3b4047; --dm-accent: #8ec5ff; }
      .dm-toolbar { position: sticky; top: 0; z-index: 10; display: flex; justify-content: space-between; gap: 12px; padding: 10px max(16px, calc((100vw - 840px) / 2)); border-bottom: 1px solid var(--dm-line); background: color-mix(in srgb, var(--dm-paper) 94%, transparent); backdrop-filter: blur(10px); font: 14px/1.2 system-ui, sans-serif; }
      .dm-toolbar button { min-height: 36px; padding: 7px 11px; border: 1px solid var(--dm-line); border-radius: 7px; background: var(--dm-paper); color: var(--dm-text); cursor: pointer; }
      .dm-toolbar button:hover { border-color: var(--dm-accent); color: var(--dm-accent); }
      .dm-tools { display: flex; gap: 6px; }
      .dm-page { width: min(100%, 920px); margin: 0 auto; padding: 36px 24px 80px; }
      .dm-page article { padding: clamp(26px, 6vw, 68px); border: 1px solid var(--dm-line); border-radius: 3px; background: var(--dm-paper); box-shadow: 0 18px 50px rgba(53, 43, 32, .08); }
      .dm-kicker { margin: 0 0 14px; color: var(--dm-accent); font: 700 12px/1.2 system-ui, sans-serif; letter-spacing: .12em; text-transform: uppercase; }
      h1 { margin: 0; font-size: clamp(34px, 6vw, 58px); font-weight: 700; line-height: 1.04; letter-spacing: -.035em; text-wrap: balance; }
      .dm-standfirst { margin: 24px 0 0; color: var(--dm-muted); font-size: clamp(20px, 3vw, 25px); line-height: 1.42; }
      .dm-byline { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 24px 0 0; color: var(--dm-muted); font: 13px/1.5 system-ui, sans-serif; }
      .dm-rule { width: 72px; height: 3px; margin: 28px 0 34px; background: var(--dm-accent); }
      #dm-content > p { margin: 0 0 1.05em; font-size: var(--dm-font-size); line-height: 1.72; }
      #dm-content > p:first-child::first-letter { float: left; margin: .05em .1em 0 0; color: var(--dm-accent); font-size: 3.5em; font-weight: 700; line-height: .8; }
      #dm-content h2 { margin: 2.1em 0 .7em; font: 750 clamp(24px, 4vw, 32px)/1.18 system-ui, sans-serif; letter-spacing: -.025em; }
      #dm-content a, footer a { color: var(--dm-accent); text-decoration-thickness: 1px; text-underline-offset: 3px; }
      figure { margin: 2.2em 0; }
      figure img { display: block; width: 100%; height: auto; max-height: 720px; border-radius: 2px; object-fit: contain; background: var(--dm-bg); }
      figcaption { margin-top: 9px; color: var(--dm-muted); font: 12px/1.45 system-ui, sans-serif; }
      footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-top: 48px; padding-top: 18px; border-top: 1px solid var(--dm-line); color: var(--dm-muted); font: 12px/1.5 system-ui, sans-serif; }
      @media (max-width: 600px) { .dm-page { padding: 0; } .dm-page article { border: 0; padding: 34px 20px 60px; } .dm-tools button:nth-child(1), .dm-tools button:nth-child(2) { display: none; } }
      @media print { .dm-toolbar { display: none; } html, body, .dm-page, .dm-page article { background: white; color: black; } .dm-page { width: 100%; padding: 0; } .dm-page article { border: 0; box-shadow: none; padding: 0; } }
    `;
  }
})();
