import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const productionRoot = join(projectRoot, "marketing", "qfp-tiktok");
const outputRoot = join(projectRoot, "dist", "marketing", "qfp-tiktok");
const sceneRoot = join(outputRoot, "scenes");
const icon = join(projectRoot, "store", "qfp", "store-icon.svg");
const beforeImage = join(outputRoot, "before.png");
const voiceover = join(outputRoot, "voiceover.aiff");
const ambient = join(outputRoot, "ambient.wav");
const silentVideo = join(outputRoot, "silent.mp4");
const finalVideo = join(outputRoot, "qfp-tiktok-v1.mp4");
const coverImage = join(outputRoot, "qfp-tiktok-cover.png");
const contactSheet = join(outputRoot, "qfp-tiktok-contact-sheet.png");
const narrationPause = 0.38;
const endDuration = 6.4;

const scenes = [
  {
    name: "01-hook", duration: 4.0, image: beforeImage,
    background: "#101614", accent: "#85c8f5", text: "#f7f2e8",
    kicker: "LOVE READING THE NEWS?", headline: "Hate crowded\nhomepages?",
    subline: "The stories are in there somewhere.", url: "morning-ledger.example"
  },
  {
    name: "02-click", duration: 3.4, image: join(projectRoot, "store", "qfp", "assets", "qfp-editorial-1280x800.png"),
    background: "#edf0e9", accent: "#15547f", text: "#171a18",
    kicker: "ONE CLICK.", headline: "The front page quietens.",
    subline: "A calm, ordered list—built from the page you opened.", url: "Quiet Front Page · Editorial view", badge: "QFP ON"
  },
  {
    name: "03-essentials", duration: 3.0, image: join(projectRoot, "store", "qfp", "assets", "qfp-editorial-1280x800.png"),
    background: "#101614", accent: "#85c8f5", text: "#f7f2e8",
    kicker: "KEEP WHAT MATTERS", headline: "Headlines. Images.\nOriginal links.",
    subline: "Discovery stays connected to the publisher.", url: "Quiet Front Page · Original story links"
  },
  {
    name: "04-display", duration: 2.2, image: join(projectRoot, "store", "qfp", "assets", "qfp-display-1280x800.png"),
    background: "#153226", accent: "#85c8f5", text: "#f7f2e8",
    kicker: "MAKE IT YOURS", headline: "Typeface and size.\nYour choice.",
    subline: "Comfortable controls stay close when you need them.", url: "Quiet Front Page · Display controls"
  },
  {
    name: "05-compact", duration: 2.0, image: join(projectRoot, "store", "qfp", "assets", "qfp-compact-1280x800.png"),
    background: "#101614", accent: "#e2bb6f", text: "#f7f2e8",
    kicker: "FOCUS", headline: "Comfortable or compact.\nYou decide.",
    subline: "See more stories or give each one room to breathe.", url: "Quiet Front Page · Compact view"
  }
];

const narrationSegments = [
  "Love reading the news online, but hate crowded home pages?",
  "One click turns the noise into a calm, ordered list of stories.",
  "Keep the headlines, images and original links.",
  "Choose the layout that suits you.",
  "Quiet Front Page.",
  "Find your story without the noise.",
  "Free for Chrome in the Extensions Store."
];

const videoDuration = scenes.reduce((total, scene) => total + scene.duration, endDuration);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(sceneRoot, { recursive: true });

const chrome = await findChrome();
await capture(chrome, join(productionRoot, "before.html"), beforeImage, 1280, 800);

const sceneVideos = [];
for (const scene of scenes) {
  const htmlPath = join(sceneRoot, `${scene.name}.html`);
  const imagePath = join(sceneRoot, `${scene.name}.png`);
  const videoPath = join(sceneRoot, `${scene.name}.mp4`);
  await writeFile(htmlPath, sceneHtml(scene));
  await capture(chrome, htmlPath, imagePath, 1080, 1920);
  await animateScene(imagePath, videoPath, scene.duration, scene.name === "01-hook", false);
  sceneVideos.push(videoPath);
}

const endHtml = join(sceneRoot, "06-end.html");
const endImage = join(sceneRoot, "06-end.png");
const endVideo = join(sceneRoot, "06-end.mp4");
await writeFile(endHtml, endCardHtml());
await capture(chrome, endHtml, endImage, 1080, 1920);
await animateScene(endImage, endVideo, endDuration, false, true);
sceneVideos.push(endVideo);

const concatFile = join(outputRoot, "scenes.txt");
await writeFile(concatFile, sceneVideos.map((path) => `file '${path}'`).join("\n") + "\n");
await run("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", concatFile, "-c", "copy", silentVideo]);

await renderNarration(narrationSegments, voiceover);

await run("ffmpeg", [
  "-y", "-loglevel", "error",
  "-f", "lavfi", "-i", `sine=frequency=196:duration=${videoDuration}:sample_rate=44100`,
  "-f", "lavfi", "-i", `sine=frequency=246.94:duration=${videoDuration}:sample_rate=44100`,
  "-f", "lavfi", "-i", `sine=frequency=293.66:duration=${videoDuration}:sample_rate=44100`,
  "-filter_complex", `[0:a]volume=0.010[a0];[1:a]volume=0.008[a1];[2:a]volume=0.007[a2];[a0][a1][a2]amix=inputs=3:duration=longest,afade=t=in:st=0:d=1.2,afade=t=out:st=${videoDuration - 2.2}:d=2.2[out]`,
  "-map", "[out]", "-c:a", "pcm_s16le", ambient
]);

await run("ffmpeg", [
  "-y", "-loglevel", "error", "-i", silentVideo, "-i", voiceover, "-i", ambient,
  "-filter_complex", "[1:a]adelay=260|260,volume=1.08[voice];[2:a]volume=0.9[bed];[voice][bed]amix=inputs=2:duration=longest:dropout_transition=0[aout]",
  "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
  "-t", String(videoDuration), "-movflags", "+faststart", finalVideo
]);

await run("ffmpeg", ["-y", "-loglevel", "error", "-ss", "0.8", "-i", finalVideo, "-frames:v", "1", coverImage]);
await renderContactSheet(finalVideo, contactSheet);

console.log(`Quiet Front Page TikTok video: ${finalVideo}`);
console.log(`Cover image: ${coverImage}`);
console.log(`Contact sheet: ${contactSheet}`);

async function capture(chromePath, htmlPath, imagePath, width, height) {
  await run(chromePath, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox", "--allow-file-access-from-files",
    "--force-device-scale-factor=1", `--window-size=${width},${height}`, `--screenshot=${imagePath}`,
    pathToFileURL(htmlPath).href
  ]);
}

async function animateScene(imagePath, videoPath, duration, fadeIn, fadeOut) {
  const frames = Math.round(duration * 30);
  const filters = [
    "zoompan=z='min(1+on*0.000015,1.008)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30"
  ];
  if (fadeIn) filters.push("fade=t=in:st=0:d=0.18");
  if (fadeOut) filters.push(`fade=t=out:st=${duration - 0.28}:d=0.28`);
  filters.push("format=yuv420p");
  await run("ffmpeg", [
    "-y", "-loglevel", "error", "-loop", "1", "-framerate", "30", "-i", imagePath,
    "-vf", filters.join(","), "-frames:v", String(frames),
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", videoPath
  ]);
}

async function renderNarration(sentences, outputPath) {
  const narrationRoot = join(outputRoot, "narration");
  await mkdir(narrationRoot, { recursive: true });
  const clips = [];
  for (const [index, sentence] of sentences.entries()) {
    const clip = join(narrationRoot, `${String(index + 1).padStart(2, "0")}.aiff`);
    await run("say", ["-v", "Serena (Premium)", "-r", "175", "-o", clip, sentence]);
    clips.push(clip);
  }

  const pauseLabels = Array.from({ length: clips.length - 1 }, (_, index) => `[pause${index}]`).join("");
  const concatInputs = clips.map((_, index) => {
    const pause = index < clips.length - 1 ? `[pause${index}]` : "";
    return `[${index}:a]${pause}`;
  }).join("");
  await run("ffmpeg", [
    "-y", "-loglevel", "error",
    ...clips.flatMap((clip) => ["-i", clip]),
    "-filter_complex", `aevalsrc=0:d=${narrationPause}:s=22050:c=mono,asplit=${clips.length - 1}${pauseLabels};${concatInputs}concat=n=${clips.length * 2 - 1}:v=0:a=1[out]`,
    "-map", "[out]", "-c:a", "pcm_s16be", outputPath
  ]);
}

async function renderContactSheet(videoPath, outputPath) {
  const contactRoot = join(outputRoot, "contact");
  await mkdir(contactRoot, { recursive: true });
  const midpoints = [];
  let elapsed = 0;
  for (const scene of scenes) {
    midpoints.push(elapsed + scene.duration / 2);
    elapsed += scene.duration;
  }
  midpoints.push(elapsed + endDuration / 2);
  for (const [index, midpoint] of midpoints.entries()) {
    await run("ffmpeg", [
      "-y", "-loglevel", "error", "-ss", midpoint.toFixed(2), "-i", videoPath,
      "-frames:v", "1", "-update", "1", join(contactRoot, `${String(index + 1).padStart(2, "0")}.png`)
    ]);
  }
  await run("ffmpeg", [
    "-y", "-loglevel", "error", "-framerate", "1", "-i", join(contactRoot, "%02d.png"),
    "-vf", "scale=270:480,tile=3x2", "-frames:v", "1", "-update", "1", outputPath
  ]);
}

function sceneHtml(scene) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: SF; src: url("file:///System/Library/Fonts/SFNS.ttf"); }
  @font-face { font-family: NY; src: url("file:///System/Library/Fonts/NewYork.ttf"); }
  * { box-sizing: border-box; }
  html, body { height: 1920px; margin: 0; overflow: hidden; width: 1080px; }
  body { background: ${scene.background}; color: ${scene.text}; font-family: SF, Arial, sans-serif; position: relative; }
  body::before { background: radial-gradient(circle, ${scene.accent}35 0, transparent 68%); content: ""; height: 1100px; position: absolute; right: -420px; top: -440px; width: 1100px; }
  body::after { background: ${scene.accent}18; border-radius: 50%; bottom: -360px; content: ""; height: 720px; left: -320px; position: absolute; width: 720px; }
  .copy { left: 72px; position: absolute; top: 178px; width: 936px; z-index: 1; }
  .kicker { color: ${scene.accent}; font-size: 31px; font-weight: 800; letter-spacing: .14em; margin-bottom: 24px; }
  h1 { font-family: NY, Georgia, serif; font-size: 76px; letter-spacing: -.025em; line-height: 1.02; margin: 0 0 30px; }
  .subline { font-size: 31px; line-height: 1.32; margin: 0; opacity: .8; }
  .rule { background: ${scene.accent}; height: 5px; margin-top: 38px; width: 82px; }
  .browser { background: #f4f0e8; border: 1px solid #ffffff44; border-radius: 28px; box-shadow: 0 30px 90px #0007; height: 692px; left: 44px; overflow: hidden; padding: 16px; position: absolute; top: 644px; width: 992px; z-index: 1; }
  .bar { align-items: center; background: #e9e5dd; display: flex; height: 60px; margin: -16px -16px 0; padding: 0 22px; }
  .dot { border-radius: 50%; height: 18px; margin-right: 10px; width: 18px; }
  .red { background: #e75a4f; } .yellow { background: #e5b544; } .green { background: #5aad66; }
  .url { color: #615d56; font-size: 20px; margin-left: 16px; }
  .screen { display: block; height: 600px; margin-top: 16px; object-fit: cover; object-position: top; width: 960px; }
  .badge { background: ${scene.accent}; border-radius: 999px; color: ${scene.background}; font-size: 20px; font-weight: 900; letter-spacing: .09em; padding: 13px 19px; position: absolute; right: 68px; top: 612px; z-index: 3; }
  .footer { bottom: 180px; color: ${scene.text}; font-size: 25px; left: 72px; letter-spacing: .04em; opacity: .52; position: absolute; z-index: 1; }
</style></head><body>
  <main class="copy"><div class="kicker">${escapeHtml(scene.kicker)}</div><h1>${lineBreaks(scene.headline)}</h1><p class="subline">${escapeHtml(scene.subline)}</p><div class="rule"></div></main>
  ${scene.badge ? `<div class="badge">${escapeHtml(scene.badge)}</div>` : ""}
  <section class="browser"><div class="bar"><i class="dot red"></i><i class="dot yellow"></i><i class="dot green"></i><span class="url">${escapeHtml(scene.url)}</span></div><img class="screen" src="${pathToFileURL(scene.image).href}" alt=""></section>
  <div class="footer">QUIET FRONT PAGE · CLEAN NEWS HOMEPAGES</div>
</body></html>`;
}

function endCardHtml() {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: SF; src: url("file:///System/Library/Fonts/SFNS.ttf"); }
  @font-face { font-family: NY; src: url("file:///System/Library/Fonts/NewYork.ttf"); }
  * { box-sizing: border-box; }
  html, body { height: 1920px; margin: 0; overflow: hidden; width: 1080px; }
  body { align-items: center; background: radial-gradient(circle at 76% 15%, #244761 0, transparent 37%), radial-gradient(circle at 5% 45%, #1d503d 0, transparent 34%), #101614; color: #f7f2e8; display: flex; flex-direction: column; font-family: SF, Arial, sans-serif; text-align: center; }
  .icon { height: 176px; margin-top: 320px; width: 176px; }
  .brand { color: #85c8f5; font-size: 34px; font-weight: 900; letter-spacing: .16em; margin: 66px 0 36px; }
  h1 { font-family: NY, Georgia, serif; font-size: 88px; letter-spacing: -.025em; line-height: .98; margin: 0; }
  .promise { font-size: 34px; font-weight: 800; letter-spacing: .11em; margin-top: 82px; }
  .line { background: #85c8f5; height: 2px; margin-top: 76px; opacity: .65; width: 880px; }
  .cta { background: #85c8f5; border-radius: 999px; color: #101614; font-size: 31px; font-weight: 900; margin-top: 82px; padding: 22px 34px; }
  .search { font-size: 35px; font-weight: 650; margin-top: 38px; opacity: .92; }
</style></head><body>
  <img class="icon" src="${pathToFileURL(icon).href}" alt=""><div class="brand">QUIET FRONT PAGE</div>
  <h1>Quietens<br>discovery.</h1><div class="promise">FIND. &nbsp;CHOOSE. &nbsp;READ.</div>
  <div class="line"></div><div class="cta">FREE ON THE CHROME WEB STORE</div><div class="search">Search for Quiet Front Page</div>
</body></html>`;
}

function lineBreaks(value) {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

async function findChrome() {
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Users/jgkeating/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
  ];
  for (const candidate of candidates) {
    try { await access(candidate, constants.X_OK); return candidate; } catch {}
  }
  throw new Error("Google Chrome or Chrome for Testing was not found");
}

function run(command, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { cwd: projectRoot, stdio: "inherit" });
    child.once("error", rejectRun);
    child.once("exit", (code) => code === 0 ? resolveRun() : rejectRun(new Error(`${command} exited with status ${code}`)));
  });
}
