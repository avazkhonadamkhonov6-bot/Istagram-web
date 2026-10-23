/**
 * Flash-i Instants ("night mode"): aksi toza dar nuri kam.
 * 1) `boostExposure` — kamera (agar dastgiri kunad) ba exposure-i baland va torch;
 * 2) `captureFrames` — chand kadr pay dar pay girifta, miyonaashon hisob meshavad: shovqini webcam
 *    (nuqtahoi rangin dar xonai torik) taqriban √N barobar kam meshavad;
 * 3) `enhance` — white balance az pikselhoi miyona, denoise-i rang, black point (siyoh — siyoh),
 *    ekspozitsiya az ruyi markaz (ruy), kontrast-i S-curve va clarity — aks ravshan va toza, na xira.
 * Sharpen va rangi zoid istifoda nameshavand — onho shovqinro zurtar mekunand.
 */

type Range = { min: number; max: number };
type Caps = MediaTrackCapabilities & { exposureCompensation?: Range; torch?: boolean; exposureMode?: string[] };
type Settings = MediaTrackSettings & { exposureCompensation?: number };

// Ravshanii ruy (markaz) pas az korkard
const TARGET_MEAN = 0.5;
const MIN_GAMMA = 0.55;
// Kontrast (S-curve), kontrasti mahalli va rang
const CONTRAST = 0.3;
const CLARITY = 0.35;
const SATURATION = 0.95;
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

/** Ravshani, rang, kontrast va shovqin — dar joy (in place) */
export function enhance(img: ImageData) {
  const { data: d, width, height } = img;
  const px = d.length / 4;
  // Markaz (ruy dar Instant): ekspozitsiya va white balance az ruyi on
  const cx0 = Math.floor(width * 0.25);
  const cx1 = Math.ceil(width * 0.75);
  const cy0 = Math.floor(height * 0.2);
  const cy1 = Math.ceil(height * 0.8);
  const inCenter = (p: number) => {
    const x = p % width;
    const y = (p / width) | 0;
    return x >= cx0 && x < cx1 && y >= cy0 && y < cy1;
  };

  // 1) White balance: faqat pikselhoi miyona (na siyoh, na safed) — rangi devor / ekran kamtar ta'sir mekunad
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let wn = 0;
  for (let p = 0, i = 0; p < px; p += 3, i += 12) {
    const r = d[i]!;
    const g = d[i + 1]!;
    const b = d[i + 2]!;
    const l = (r + g + b) / 3;
    if (l < 20 || l > 235) continue;
    const w = inCenter(p) ? 2 : 1;
    sr += r * w;
    sg += g * w;
    sb += b * w;
    wn += w;
  }
  const avg = (sr + sg + sb) / 3;
  const clampGain = (g: number) => Math.min(1.8, Math.max(0.6, g));
  const gr = wn ? clampGain(avg / Math.max(sr, 1)) : 1;
  const gg = wn ? clampGain(avg / Math.max(sg, 1)) : 1;
  const gb = wn ? clampGain(avg / Math.max(sb, 1)) : 1;

  // 2) YCbCr: rang (Cb/Cr) bo blur-i 7×7 — nuqtahoi rangin nest
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
  // Y: blur-i sabuk (3×3) — shovqin kam; clarity: kontrasti mahalli (radius 12) — aks "xira" nest
  const fine = Y.slice();
  boxBlur(fine, width, height, 1);
  const wide = Y.slice();
  boxBlur(wide, width, height, 12);
  for (let p = 0; p < px; p++) {
    const y = Y[p]! * 0.4 + fine[p]! * 0.6;
    Y[p] = y + (y - wide[p]!) * CLARITY;
  }

  // 3) Black point / white point az hamai aks, ekspozitsiya az markaz (ruy)
  const hist = new Uint32Array(256);
  let samples = 0;
  let centerSum = 0;
  let centerN = 0;
  for (let p = 0; p < px; p += 3) {
    const v = Math.min(255, Math.max(0, Math.round(Y[p]!)));
    hist[v]!++;
    samples++;
    if (inCenter(p)) {
      centerSum += v;
      centerN++;
    }
  }
  const at = (q: number) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) if ((acc += hist[v]!) >= samples * q) return v;
    return 255;
  };
  // Siyoh — siyoh (haze nest); gain-i maks. ~2.5× (hi - lo >= 100) — shovqin kalon nashavad
  const lo = at(0.02);
  const hi = Math.max(at(0.995), lo + 100);
  const center = centerN ? centerSum / centerN : 128;
  const mid = Math.min(Math.max((center - lo) / (hi - lo), 0.02), 0.98);
  const gamma = Math.min(1.2, Math.max(MIN_GAMMA, Math.log(TARGET_MEAN) / Math.log(mid)));
  const lut = new Float32Array(256);
  for (let v = 0; v < 256; v++) {
    const x = Math.min(Math.max((v - lo) / (hi - lo), 0), 1);
    const y = Math.pow(x, gamma);
    // S-curve: kontrast — siyohho chuqur, ravshanho toza
    const sCurve = y * y * (3 - 2 * y);
    lut[v] = 255 * (y + (sCurve - y) * CONTRAST);
  }

  // 4) Bozgasht ba RGB; rang bo nisbati ravshani (to 2×), saturation-i kami past — boqimondai rang nest
  for (let p = 0, i = 0; p < px; p++, i += 4) {
    const y0 = Math.min(255, Math.max(0, Y[p]!));
    const y1 = lut[Math.round(y0)]!;
    const k = (y0 > 1 ? Math.min(y1 / y0, 2) : 1) * SATURATION;
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
