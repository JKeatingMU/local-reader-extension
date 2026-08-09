(() => {
  "use strict";

  const ROOT_ID = "textuary-quiet-front-page";
  const MAX_STORIES = 80;
  const sourceUrl = location.href;

  if (document.getElementById(ROOT_ID)) {
    location.reload();
    return;
  }

  const stories = collectStories();
  if (stories.length < 3) {
    showNotice("Quiet Front Page could not find a reliable list of stories on this page.");
    return;
  }

  render(stories);

  function collectStories() {
    const candidates = new Map();
    const anchors = [...document.querySelectorAll("a[href]")];

    anchors.forEach((anchor, order) => {
      if (isPageFurniture(anchor)) return;
      const url = storyUrl(anchor.getAttribute("href"));
      if (!url || url === canonicalUrl(sourceUrl)) return;

      const heading = headlineElement(anchor);
      const headline = normalizedText(
        heading?.textContent || anchor.getAttribute("aria-label") || anchor.textContent
      );
      if (!isPlausibleHeadline(headline)) return;

      const container = findStoryContainer(anchor, heading);
      if (!container || isPageFurniture(container)) return;

      const image = findStoryImage(container, headline);
      const summary = findSummary(container, headline);
      const time = findTime(container);
      const score = storyScore({ anchor, heading, container, image, summary, url });
      if (score < 5) return;

      const candidate = { url, headline, image, summary, time, score, order };
      const existing = candidates.get(url);
      if (!existing) {
        candidates.set(url, candidate);
        return;
      }

      existing.image ||= candidate.image;
      existing.summary ||= candidate.summary;
      existing.time ||= candidate.time;
      if (candidate.score > existing.score) {
        existing.headline = candidate.headline;
        existing.score = candidate.score;
      }
      existing.order = Math.min(existing.order, candidate.order);
    });

    return [...candidates.values()]
      .sort((left, right) => left.order - right.order)
      .slice(0, MAX_STORIES);
  }

  function storyUrl(value) {
    try {
      const url = new URL(value, sourceUrl);
      if (!/^https?:$/i.test(url.protocol)) return "";
      if (!samePublication(url.hostname, location.hostname)) return "";
      if (/\.(?:jpg|jpeg|png|gif|webp|svg|pdf|xml)(?:$|\?)/i.test(url.pathname)) return "";
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"]
        .forEach((parameter) => url.searchParams.delete(parameter));
      url.hash = "";
      return canonicalUrl(url.href);
    } catch {
      return "";
    }
  }

  function canonicalUrl(value) {
    try {
      const url = new URL(value);
      url.pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
      return url.href;
    } catch {
      return "";
    }
  }

  function samePublication(candidate, current) {
    const cleanCandidate = candidate.replace(/^www\./i, "").toLowerCase();
    const cleanCurrent = current.replace(/^www\./i, "").toLowerCase();
    return cleanCandidate === cleanCurrent;
  }

  function headlineElement(anchor) {
    if (/^H[1-4]$/.test(anchor.tagName)) return anchor;
    return anchor.querySelector("h1, h2, h3, h4") || anchor.closest("h1, h2, h3, h4");
  }

  function isPlausibleHeadline(value) {
    if (value.length < 24 || value.length > 220) return false;
    const words = value.split(/\s+/).filter(Boolean);
    if (words.length < 4 || words.length > 32) return false;
    if (/^(?:home|news|sport|sports|politics|business|culture|opinion|lifestyle|more|menu|subscribe|sign in|log in|read more)$/i.test(value)) return false;
    if (/^(?:advertisement|sponsored|promoted|partner content)\b/i.test(value)) return false;
    return /[\p{L}\p{N}]/u.test(value);
  }

  function findStoryContainer(anchor, heading) {
    let current = heading || anchor;
    let fallback = current.parentElement;
    for (let depth = 0; current && depth < 7; depth += 1, current = current.parentElement) {
      if (/^(?:ARTICLE|LI)$/.test(current.tagName)) return current;
      const signature = `${current.className || ""} ${current.id || ""}`;
      if (/teaser|story|card|headline|promo|item|result/i.test(signature)) fallback = current;
      const headings = current.querySelectorAll?.("h1, h2, h3, h4").length || 0;
      const links = current.querySelectorAll?.("a[href]").length || 0;
      if (headings === 1 && links <= 5 && normalizedText(current.textContent).length <= 1200) fallback = current;
      if (/^(?:MAIN|SECTION|BODY)$/.test(current.tagName)) break;
    }
    return fallback;
  }

  function findStoryImage(container, headline) {
    const images = [...container.querySelectorAll("img")];
    let best = null;
    let bestScore = -Infinity;
    for (const image of images) {
      const url = imageUrl(image);
      if (!url) continue;
      const signature = `${image.className || ""} ${image.id || ""} ${image.alt || ""}`;
      if (/logo|avatar|icon|sprite|advert|sponsor|pixel|tracking/i.test(signature)) continue;
      const area = Math.max(0, Number(image.naturalWidth || image.width)) * Math.max(0, Number(image.naturalHeight || image.height));
      const alt = normalizedText(image.alt);
      const sharedWords = wordOverlap(alt, headline);
      const score = Math.min(4, area / 80_000) + sharedWords * 0.5 + (alt.length > 20 ? 1 : 0);
      if (score > bestScore) {
        best = url;
        bestScore = score;
      }
    }
    return best || "";
  }

  function imageUrl(image) {
    const attributes = [
      image.currentSrc,
      image.getAttribute("src"),
      image.getAttribute("data-src"),
      image.getAttribute("data-original"),
      image.getAttribute("data-lazy-src"),
      image.getAttribute("data-image-src")
    ];
    const srcset = image.getAttribute("srcset") || image.getAttribute("data-srcset") || "";
    attributes.push(srcset.split(",").at(-1)?.trim().split(/\s+/)[0]);
    for (const value of attributes) {
      if (!value || /^(?:data:|blob:|javascript:|about:)/i.test(value)) continue;
      if (/blank|spacer|transparent|placeholder|pixel/i.test(value)) continue;
      try {
        const url = new URL(value, sourceUrl);
        if (/^https?:$/i.test(url.protocol)) return url.href;
      } catch {}
    }
    return "";
  }

  function findSummary(container, headline) {
    const candidates = container.querySelectorAll("p, [class*='summary'], [class*='standfirst'], [class*='description']");
    for (const node of candidates) {
      const text = normalizedText(node.textContent);
      if (text === headline || text.length < 35 || text.length > 320) continue;
      if (/advertisement|subscribe|newsletter|cookie|privacy|sponsored/i.test(text)) continue;
      return text;
    }
    return "";
  }

  function findTime(container) {
    const time = container.querySelector("time");
    const value = normalizedText(time?.textContent || "");
    return value.length <= 80 ? value : "";
  }

  function storyScore({ anchor, heading, container, image, summary, url }) {
    let score = 0;
    if (heading) score += ({ H1: 4, H2: 3, H3: 2, H4: 1 })[heading.tagName] || 1;
    if (container.tagName === "ARTICLE") score += 3;
    if (image) score += 3;
    if (summary) score += 1;
    if (/\/[a-z0-9-]{12,}(?:\/|$)/i.test(new URL(url).pathname)) score += 2;
    if (anchor.getAttribute("aria-label")) score += 0.5;
    return score;
  }

  function isPageFurniture(node) {
    if (!node?.closest) return false;
    return Boolean(node.closest([
      "header", "nav", "footer", "aside", "dialog", "form",
      "[role='navigation']", "[role='dialog']", "[aria-modal='true']",
      "[class*='advert']", "[class*='cookie']", "[class*='newsletter']"
    ].join(",")));
  }

  function wordOverlap(left, right) {
    const rightWords = new Set(words(right));
    return words(left).filter((word) => rightWords.has(word)).length;
  }

  function words(value) {
    return normalizedText(value).toLocaleLowerCase().match(/[\p{L}\p{N}]{4,}/gu) || [];
  }

  function normalizedText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function siteName() {
    const metadata = document.querySelector('meta[property="og:site_name"]')?.content;
    if (metadata?.trim()) return normalizedText(metadata);
    return location.hostname.replace(/^www\./i, "").split(".")[0]
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function render(items) {
    const publication = siteName();
    const originalTitle = document.title;
    window.stop();
    document.title = `${publication} — Quiet Front Page`;
    document.documentElement.style.overflow = "hidden";

    const host = document.createElement("div");
    host.id = ROOT_ID;
    host.dataset.storyCount = String(items.length);
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>${styles()}</style>
      <div class="qfp-shell">
        <header class="qfp-toolbar">
          <button id="qfp-original" type="button">← Original page</button>
          <div class="qfp-toolbar-actions">
            <button id="qfp-detail" type="button" aria-pressed="false">Headlines only</button>
            <button id="qfp-density" type="button" aria-pressed="false">Compact view</button>
          </div>
        </header>
        <main>
          <header class="qfp-intro">
            <p class="qfp-eyebrow">TEXTUARY LAB</p>
            <h1>${escapeHtml(publication)}</h1>
            <p class="qfp-deck">A quieter front page with ${items.length} stories from the page you selected.</p>
            <p class="qfp-source">${escapeHtml(originalTitle)}</p>
          </header>
          <section class="qfp-stories" aria-label="Stories">
            ${items.map(storyMarkup).join("")}
          </section>
        </main>
        <footer class="qfp-footer">Quiet Front Page is an experimental local Textuary view. Story links open the publisher's original page.</footer>
      </div>
    `;
    document.documentElement.append(host);

    const shell = shadow.querySelector(".qfp-shell");
    shadow.getElementById("qfp-original").addEventListener("click", () => location.reload());
    shadow.getElementById("qfp-detail").addEventListener("click", (event) => {
      const active = shell.classList.toggle("qfp-headlines-only");
      event.currentTarget.textContent = active ? "Show summaries" : "Headlines only";
      event.currentTarget.setAttribute("aria-pressed", String(active));
    });
    shadow.getElementById("qfp-density").addEventListener("click", (event) => {
      const active = shell.classList.toggle("qfp-compact");
      event.currentTarget.textContent = active ? "Comfortable view" : "Compact view";
      event.currentTarget.setAttribute("aria-pressed", String(active));
    });
  }

  function storyMarkup(story, index) {
    const media = story.image
      ? `<div class="qfp-media"><img src="${escapeAttribute(story.image)}" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer-when-downgrade"></div>`
      : "";
    const details = [story.time, story.summary].filter(Boolean);
    return `
      <article class="qfp-story${story.image ? "" : " qfp-story-text"}" data-story-index="${index + 1}">
        ${media}
        <div class="qfp-copy">
          <p class="qfp-number">${String(index + 1).padStart(2, "0")}</p>
          <h2><a href="${escapeAttribute(story.url)}">${escapeHtml(story.headline)}</a></h2>
          ${story.time ? `<p class="qfp-time">${escapeHtml(story.time)}</p>` : ""}
          ${story.summary ? `<p class="qfp-summary">${escapeHtml(story.summary)}</p>` : ""}
          ${details.length ? "" : '<p class="qfp-summary qfp-summary-muted">Open the original story</p>'}
        </div>
      </article>
    `;
  }

  function showNotice(message) {
    const notice = document.createElement("div");
    notice.textContent = message;
    Object.assign(notice.style, {
      position: "fixed", top: "18px", right: "18px", zIndex: "2147483647",
      maxWidth: "380px", padding: "14px 18px", borderRadius: "10px",
      color: "#f8fafc", background: "#1f2937", boxShadow: "0 12px 32px rgba(0,0,0,.24)",
      font: "14px/1.45 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    });
    document.body.append(notice);
    setTimeout(() => notice.remove(), 5000);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function styles() {
    return `
      :host { all:initial; position:fixed; inset:0; z-index:2147483647; overflow:auto; color-scheme:light; --ink:#23221f; --muted:#746d65; --line:#d9d2c7; --paper:#f5f1e8; --sheet:#fffdf8; --accent:#0d4a86; color:var(--ink); background:var(--paper); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
      * { box-sizing:border-box; }
      .qfp-shell { min-height:100%; color:var(--ink); background:var(--paper); }
      button { color:inherit; border:1px solid var(--line); background:var(--sheet); border-radius:9px; padding:.68rem .9rem; font:600 14px/1 inherit; cursor:pointer; }
      button:hover { border-color:#9e9487; background:#fff; }
      .qfp-toolbar { position:sticky; top:0; z-index:10; display:flex; align-items:center; justify-content:space-between; gap:1rem; min-height:58px; padding:10px 18px; border-bottom:1px solid var(--line); background:rgba(255,253,248,.94); backdrop-filter:blur(18px); }
      .qfp-toolbar-actions { display:flex; gap:.55rem; }
      main { width:min(1080px,calc(100% - 40px)); margin:0 auto; padding:70px 0 80px; }
      .qfp-intro { max-width:860px; margin-bottom:48px; }
      .qfp-eyebrow { margin:0 0 12px; color:var(--accent); font-size:13px; font-weight:800; letter-spacing:.16em; }
      h1 { margin:0; font:700 clamp(48px,8vw,84px)/.96 Georgia,"Times New Roman",serif; letter-spacing:-.045em; }
      .qfp-deck { max-width:680px; margin:24px 0 8px; color:#5d564f; font:400 21px/1.5 Georgia,"Times New Roman",serif; }
      .qfp-source { margin:0; color:var(--muted); font-size:13px; }
      .qfp-stories { border-top:2px solid var(--ink); }
      .qfp-story { display:grid; grid-template-columns:minmax(260px,36%) 1fr; gap:32px; padding:30px 0; border-bottom:1px solid var(--line); }
      .qfp-story-text { grid-template-columns:1fr; }
      .qfp-media { overflow:hidden; aspect-ratio:16/10; background:#e8e1d6; border-radius:3px; }
      .qfp-media img { display:block; width:100%; height:100%; object-fit:cover; }
      .qfp-copy { align-self:center; max-width:680px; }
      .qfp-number { margin:0 0 10px; color:var(--accent); font-size:12px; font-weight:800; letter-spacing:.12em; }
      h2 { margin:0; font:700 clamp(26px,3.2vw,42px)/1.07 Georgia,"Times New Roman",serif; letter-spacing:-.025em; }
      h2 a { color:inherit; text-decoration:none; text-decoration-thickness:1px; text-underline-offset:.16em; }
      h2 a:hover { color:var(--accent); text-decoration:underline; }
      .qfp-time { margin:12px 0 0; color:var(--accent); font-size:13px; font-weight:700; }
      .qfp-summary { margin:13px 0 0; color:#5d564f; font:400 17px/1.55 Georgia,"Times New Roman",serif; }
      .qfp-summary-muted { color:var(--muted); font-family:inherit; font-size:13px; }
      .qfp-footer { max-width:1080px; margin:0 auto; padding:28px 20px 44px; color:var(--muted); border-top:1px solid var(--line); font-size:12px; text-align:center; }
      .qfp-headlines-only .qfp-summary { display:none; }
      .qfp-compact main { padding-top:42px; }
      .qfp-compact .qfp-intro { margin-bottom:30px; }
      .qfp-compact .qfp-story { grid-template-columns:180px 1fr; gap:22px; padding:18px 0; }
      .qfp-compact .qfp-story-text { grid-template-columns:1fr; }
      .qfp-compact h2 { font-size:clamp(22px,2.6vw,31px); }
      .qfp-compact .qfp-summary { font-size:15px; }
      @media (max-width:700px) {
        .qfp-toolbar { align-items:flex-start; flex-wrap:wrap; }
        .qfp-toolbar-actions { width:100%; }
        .qfp-toolbar-actions button { flex:1; }
        main { width:min(100% - 28px,1080px); padding-top:42px; }
        h1 { font-size:50px; }
        .qfp-story,.qfp-compact .qfp-story { grid-template-columns:1fr; gap:18px; }
        .qfp-media { aspect-ratio:16/9; }
      }
      @media (prefers-color-scheme:dark) {
        :host { color-scheme:dark; --ink:#f1eadf; --muted:#b9afa2; --line:#47443e; --paper:#151614; --sheet:#20211e; --accent:#83bce9; }
        .qfp-toolbar { background:rgba(32,33,30,.94); }
        .qfp-deck,.qfp-summary { color:#c9c0b5; }
        button:hover { background:#292a27; border-color:#777168; }
        .qfp-media { background:#292a27; }
      }
    `;
  }
})();
