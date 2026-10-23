/**
 * Flash-i Instants ("night mode"): aksi toza dar nuri kam.
 * 1) `boostExposure` — kamera (agar dastgiri kunad) ba exposure-i baland va torch;
 * 2) `captureFrames` — chand kadr pay dar pay girifta, miyonaashon hisob meshavad: shovqini webcam
 *    (nuqtahoi rangin dar xonai torik) taqriban √N barobar kam meshavad;
 * 3) `enhance` — white balance-i avtomati (rangi binafsh / surx narmal), denoise-i rang,
 *    auto-levels va gamma-i narm (ravshan, vale nuri safed nemesuzad).
 * Sharpen va rangi zoid istifoda nameshavand — onho shovqinro zurtar mekunand.
 */

type Range = { min: number; max: number };
type Caps = MediaTrackCapabilities & { exposureCompensation?: Range; torch?: boolean; exposureMode?: string[] };
type Settings = MediaTrackSettings & { exposureCompensation?: number };

const TARGET_MEAN = 0.5;
const MIN_GAMMA = 0.5;
const FRAMES = 12;

/** Kamera-ro muvaqqatan ravshan mekunad; funksiyai bozgardonandaro bar megardonad */
export async function boostExposure(track: MediaStreamTrack | undefined): Promise<() => Promise<void>> {
  if (!track?.getCapabilities) return async () => {};
  const caps = track.getCapabilities() as Caps;
  const before = track.getSettings() as Settings;
  const boost: Record<string, unknown> = {};
  if (caps.torch) boost.torch = true;
  if (caps.exposureMode?.includes("continuous")) boost.exposureMode = "continuous";
  if (caps.exposureCompensation) {
    const { min, max } = caps.exposureCompensation;
    boost.exposureCompensation = min + (max - min) * 0.75;
  }
  if (!Object.keys(boost).length) return async () => {};
  await track.applyConstraints({ advanced: [boost as MediaTrackConstraintSet] }).catch(() => undefined);

  return async () => {
    const restore: Record<string, unknown> = {};
    if ("torch" in boost) restore.torch = false;
    if ("exposureCompensation" in boost && before.exposureCompensation !== undefined)
      restore.exposureCompensation = before.exposureCompensation;
    if (Object.keys(restore).length)
      await track.applyConstraints({ advanced: [restore as MediaTrackConstraintSet] }).catch(() => undefined);
  };
}

const nextFrame = (video: HTMLVideoElement) =>
  new Promise<void>((resolve) => {
    const v = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number };
    // Agar kadr-i nav nayoyad (tab-i pinhon) — ba'd az 80 ms ham davom medihem
    const t = setTimeout(resolve, 80);
    v.requestVideoFrameCallback?.(() => {
      clearTimeout(t);
      resolve();
    });
  });

/** N kadr-i pay dar pay → miyona (shovqin kam). `mirror` — kamerai pesh. */
export async function captureFrames(
  video: HTMLVideoElement,
  ctx: CanvasRenderingContext2D,
  mirror: boolean,
  frames = FRAMES,
): Promise<ImageData> {
  const { width, height } = ctx.canvas;
  ctx.save();
  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  let sum: Float32Array | undefined;
  let img: ImageData | undefined;
  for (let n = 0; n < frames; n++) {
    if (n) await nextFrame(video);
    ctx.drawImage(video, 0, 0, width, height);
    img = ctx.getImageData(0, 0, width, height);
    sum ??= new Float32Array(img.data.length);
    const d = img.data;
    for (let i = 0; i < d.length; i++) sum[i]! += d[i]!;
  }
  ctx.restore();
  const d = img!.data;
  for (let i = 0; i < d.length; i++) d[i] = sum![i]! / frames;
  return img!;
}

/** Ravshani, rang va shovqin — dar joy (in place) */
export function enhance(img: ImageData) {
  const { data: d, width, height } = img;
  const px = d.length / 4;

  // 1) White balance (gray world, bo mahdudiyat): miyonai R, G, B barobar meshavand
  let sr = 0;
  let sg = 0;
  let sb = 0;
  for (let i = 0; i < d.length; i += 16) {
    sr += d[i]!;
    sg += d[i + 1]!;
    sb += d[i + 2]!;
  }
  const avg = (sr + sg + sb) / 3;
  const clampGain = (g: number) => Math.min(1.6, Math.max(0.7, g));
  const gr = clampGain(avg / Math.max(sr, 1));
  const gg = clampGain(avg / Math.max(sg, 1));
  const gb = clampGain(avg / Math.max(sb, 1));

  // 2) Denoise-i rang: Y (tafsilot) nigoh doshta, Cb/Cr (nuqtahoi rangin) bo blur-i 7×7 hamvor
  const Y = new Float32Array(px);
  const Cb = new Float32Array(px);
  const Cr = new Float32Array(px);
  for (let p = 0, i = 0; p < px; p++, i += 4) {
    const r = d[i]! * gr;
    const g = d[i + 1]! * gg;
    const b = d[i + 2]! * gb;
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    Y[p] = y;
    Cb[p] = b - y;
    Cr[p] = r - y;
  }
  boxBlur(Cb, width, height, 3);
  boxBlur(Cr, width, height, 3);
  // Y — blur-i sabuk (3×3) bo omezish: shovqini ravshani kam, ruy aniq memonad
  const Ys = Y.slice();
  boxBlur(Ys, width, height, 1);
  for (let p = 0; p < px; p++) Y[p] = Y[p]! * 0.35 + Ys[p]! * 0.65;

  // 3) Levels + gamma-i narm az ruyi histogram-i Y
  const hist = new Uint32Array(256);
  let samples = 0;
  for (let p = 0; p < px; p += 4) {
    hist[Math.min(255, Math.max(0, Math.round(Y[p]!)))]!++;
    samples++;
  }
  const at = (q: number) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) if ((acc += hist[v]!) >= samples * q) return v;
    return 255;
  };
  // Gain-i maks. ~2.3× (hi - lo >= 110): kashishi zur shovqinro kalon mekunad
  const lo = Math.min(at(0.005), 30);
  const hi = Math.max(at(0.995), lo + 110);
  let sum = 0;
  for (let v = 0; v < 256; v++) sum += v * hist[v]!;
  const mid = Math.min(Math.max((sum / samples - lo) / (hi - lo), 0.02), 0.98);
  const gamma = Math.min(1, Math.max(MIN_GAMMA, Math.log(TARGET_MEAN) / Math.log(mid)));
  const lut = new Float32Array(256);
  for (let v = 0; v < 256; v++) {
    const x = Math.min(Math.max((v - lo) / (hi - lo), 0), 1);
    // Gamma va "shoulder"-i narm dar ravshanho — nuri safed nemesuzad
    const y = Math.pow(x, gamma);
    lut[v] = 255 * (y < 0.85 ? y : 0.85 + (y - 0.85) * 0.7);
  }

  // 4) Bozgasht ba RGB: rang bo hamon nisbati ravshani (to 2×) miqyos meshavad
  for (let p = 0, i = 0; p < px; p++, i += 4) {
    const y0 = Y[p]!;
    const y1 = lut[Math.min(255, Math.max(0, Math.round(y0)))]!;
    const k = y0 > 1 ? Math.min(y1 / y0, 2) : 1;
    const cb = Cb[p]! * k;
    const cr = Cr[p]! * k;
    const r = y1 + cr;
    const b = y1 + cb;
    d[i] = r;
    d[i + 1] = (y1 - 0.299 * r - 0.114 * b) / 0.587;
    d[i + 2] = b;
  }
}

/** Box blur-i ajrashavanda (radius r), dar joy */
function boxBlur(a: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(a.length);
  const size = r * 2 + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += a[row + Math.min(w - 1, Math.max(0, x))]!;
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc / size;
      acc += a[row + Math.min(w - 1, x + r + 1)]! - a[row + Math.max(0, x - r)]!;
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x]!;
    for (let y = 0; y < h; y++) {
      a[y * w + x] = acc / size;
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x]! - tmp[Math.max(0, y - r) * w + x]!;
    }
  }
}
