/**
 * Flash-i Instants: ravshankunii voqeii aks (na faqat ekrani safed).
 * 1) `boostExposure` — kamera (agar dastgiri kunad) ba exposure / brightness-i baland va torch;
 * 2) `brighten` — pikselhoi aks tahlil meshavand: auto-levels (1% … 99%) va gamma,
 *    to ravshanii miyona ba ~58% rasad. Aksi torik bisyor ravshan meshavad, aksi ravshan — qariban bidun tagyir.
 */

type Range = { min: number; max: number };
type Caps = MediaTrackCapabilities & { exposureCompensation?: Range; brightness?: Range; torch?: boolean; exposureMode?: string[] };
type Settings = MediaTrackSettings & { exposureCompensation?: number; brightness?: number; exposureMode?: string };

const TARGET_MEAN = 0.58;

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
    boost.exposureCompensation = min + (max - min) * 0.85;
  }
  if (caps.brightness) {
    const { min, max } = caps.brightness;
    boost.brightness = min + (max - min) * 0.8;
  }
  if (!Object.keys(boost).length) return async () => {};
  await track.applyConstraints({ advanced: [boost as MediaTrackConstraintSet] }).catch(() => undefined);

  return async () => {
    const restore: Record<string, unknown> = {};
    if ("torch" in boost) restore.torch = false;
    if ("exposureCompensation" in boost && before.exposureCompensation !== undefined)
      restore.exposureCompensation = before.exposureCompensation;
    if ("brightness" in boost && before.brightness !== undefined) restore.brightness = before.brightness;
    if (Object.keys(restore).length)
      await track.applyConstraints({ advanced: [restore as MediaTrackConstraintSet] }).catch(() => undefined);
  };
}

/** Auto-levels + gamma dar canvas; ravshanii miyonai pesh va pas-ro bar megardonad (0…1) */
export function brighten(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  const hist = new Uint32Array(256);
  // Har piksel-i 4-um baroi sur'at — baroi histogram kifoya
  let samples = 0;
  for (let i = 0; i < d.length; i += 16) {
    hist[(d[i]! * 77 + d[i + 1]! * 150 + d[i + 2]! * 29) >> 8]!++;
    samples++;
  }
  const at = (p: number) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) if ((acc += hist[v]!) >= samples * p) return v;
    return 255;
  };
  const lo = Math.min(at(0.01), 60);
  const hi = Math.max(at(0.995), lo + 40);
  let sum = 0;
  for (let v = 0; v < 256; v++) sum += v * hist[v]!;
  const before = sum / samples / 255;

  // Miyona pas az levels → gamma, ki onro ba TARGET_MEAN merasonad (faqat ravshan, hech gah torik)
  const mid = Math.min(Math.max((before * 255 - lo) / (hi - lo), 0.02), 0.98);
  const gamma = Math.min(1, Math.max(0.35, Math.log(TARGET_MEAN) / Math.log(mid)));
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    const x = Math.min(Math.max((v - lo) / (hi - lo), 0), 1);
    lut[v] = Math.round(Math.pow(x, gamma) * 255);
  }
  for (let i = 0; i < d.length; i += 4) {
    d[i] = lut[d[i]!]!;
    d[i + 1] = lut[d[i + 1]!]!;
    d[i + 2] = lut[d[i + 2]!]!;
  }
  ctx.putImageData(img, 0, 0);

  let after = 0;
  for (let v = 0; v < 256; v++) after += lut[v]! * hist[v]!;
  return { before, after: after / samples / 255 };
}
