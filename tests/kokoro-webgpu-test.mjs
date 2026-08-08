const port = Number(process.argv[2] || 9367);
const moduleUrl = process.argv[3] || "http://127.0.0.1:8767/kokoro.web.js";
const dtype = process.argv[4] || "fp32";
const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
const page = targets.find((target) => target.type === "page");
if (!page) throw new Error("No Chrome page target found");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const request = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});

function call(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

await call("Runtime.enable");
await call("Page.navigate", { url: "http://127.0.0.1:8767/store-article.html" });
await new Promise((resolve) => setTimeout(resolve, 500));

const evaluation = await call("Runtime.evaluate", {
  expression: `(async () => {
    if (!navigator.gpu) throw new Error('WebGPU is unavailable');
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('Chrome did not provide a WebGPU adapter');
    const started = performance.now();
    const { KokoroTTS, env } = await import(${JSON.stringify(moduleUrl)});
    env.wasmPaths = new URL('.', ${JSON.stringify(moduleUrl)}).href;
    env.logLevel = 'error';
    let lastProgress = -1;
    const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: ${JSON.stringify(dtype)},
      device: 'webgpu',
      progress_callback(progress) {
        if (progress?.status !== 'progress' || !/onnx|model/i.test(String(progress.file || ''))) return;
        const rounded = Math.floor(progress.progress / 10) * 10;
        if (rounded > lastProgress) {
          lastProgress = rounded;
          console.info('Textuary Kokoro model', rounded + '%');
        }
      }
    });
    const loaded = performance.now();
    const audio = await tts.generate('Textuary natural voices are ready for a quiet afternoon of reading.', {
      voice: 'bf_emma',
      speed: 1
    });
    const firstFinished = performance.now();
    const warmAudio = await tts.generate('The second passage measures warm generation speed.', {
      voice: 'bf_emma',
      speed: 1
    });
    const finished = performance.now();
    return JSON.stringify({
      adapter: adapter.info || null,
      dtype: ${JSON.stringify(dtype)},
      logLevel: env.logLevel,
      modelLoadSeconds: Number(((loaded - started) / 1000).toFixed(2)),
      firstGenerationSeconds: Number(((firstFinished - loaded) / 1000).toFixed(2)),
      warmGenerationSeconds: Number(((finished - firstFinished) / 1000).toFixed(2)),
      audioSeconds: Number((audio.audio.length / audio.sampling_rate).toFixed(2)),
      warmAudioSeconds: Number((warmAudio.audio.length / warmAudio.sampling_rate).toFixed(2)),
      sampleRate: audio.sampling_rate,
      samples: audio.audio.length
    });
  })()`,
  awaitPromise: true,
  returnByValue: true
});

if (evaluation.exceptionDetails) {
  throw new Error(evaluation.exceptionDetails.exception?.description || "Kokoro WebGPU test failed");
}

const result = JSON.parse(evaluation.result.value);
if (result.logLevel !== "error" || result.samples <= 0 || result.sampleRate <= 0) {
  throw new Error(`Kokoro did not retain error-only logging or generate valid audio: ${JSON.stringify(result)}`);
}
console.log(JSON.stringify(result, null, 2));
socket.close();
