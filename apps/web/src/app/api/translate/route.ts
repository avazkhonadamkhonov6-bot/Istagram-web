import { forbiddenOrigin, isSameOrigin, json, readToken } from "@/lib/bff";

/**
 * "See translation" (misli Instagram): tarjimai matni korbar — caption, comment — ba zaboni UI.
 * Dar server (BFF): brauzer ba servisi beruni mustaqim namerasad (CSP), natija dar kesh-i xotira.
 * Manba: Google Translate (gtx); agar javob nadihad — MyMemory.
 */
const TARGETS = new Set(["en", "ru", "tg"]);
const MAX_CHARS = 2000;
const cache = new Map<string, { text: string; source: string }>();
const CACHE_MAX = 2000;

// Google tojikiro bo kirilli medihad; UI-i Tojiki — lotini
const TG_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ғ: "gh", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", ӣ: "i",
  й: "y", к: "k", қ: "q", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ӯ: "u", ф: "f", х: "x", ҳ: "h", ч: "ch", ҷ: "j", ш: "sh", щ: "sh", ъ: "'", ь: "", ы: "i", э: "e",
  ю: "yu", я: "ya", ц: "ts",
};

function toTajikLatin(s: string) {
  return s.replace(/[Ѐ-ӿ]/g, (ch) => {
    const lower = ch.toLowerCase();
    const latin = TG_LATIN[lower] ?? ch;
    return ch === lower || !latin ? latin : latin[0]!.toUpperCase() + latin.slice(1);
  });
}

async function google(text: string, to: string) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store" });
  if (!res.ok) throw new Error(`google ${res.status}`);
  const data = (await res.json()) as [[string, string][], unknown, string];
  return { text: data[0].map((seg) => seg[0]).join(""), source: data[2] ?? "auto" };
}

async function myMemory(text: string, to: string) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=Autodetect|${to}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store" });
  if (!res.ok) throw new Error(`mymemory ${res.status}`);
  const data = (await res.json()) as { responseData?: { translatedText?: string; detectedLanguage?: string } };
  const out = data.responseData?.translatedText;
  if (!out) throw new Error("mymemory empty");
  return { text: out, source: data.responseData?.detectedLanguage ?? "auto" };
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return forbiddenOrigin();
  // Faqat baroi korbari voridshuda — servis baroi begonaho kushoda nest
  if (!(await readToken())) return json({ data: null, errors: ["Avval vorid shaved"], statusCode: 401 });

  const body = (await req.json().catch(() => null)) as { text?: unknown; to?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, MAX_CHARS) : "";
  const to = typeof body?.to === "string" && TARGETS.has(body.to) ? body.to : "en";
  if (!text) return json({ data: null, errors: ["Matn nest"], statusCode: 400 });

  const key = `${to}\n${text}`;
  const hit = cache.get(key);
  if (hit) return json({ data: hit, errors: [], statusCode: 200 });

  let result: { text: string; source: string } | undefined;
  for (const provider of [google, myMemory]) {
    try {
      result = await provider(text, to);
      break;
    } catch {
      // navbati
    }
  }
  if (!result) return json({ data: null, errors: ["Couldn't translate. Try again."], statusCode: 502 });
  if (to === "tg") result = { ...result, text: toTajikLatin(result.text) };

  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(key, result);
  return json({ data: result, errors: [], statusCode: 200 });
}
