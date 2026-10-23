"use client";

import { useEffect, useSyncExternalStore } from "react";
import { DICT, normalize, PATTERNS, type Lang } from "./dictionary";

const KEY = "ig-lang";
const ATTRS = ["placeholder", "aria-label", "title"] as const;
// Matni korbar (paymho, comment, caption) va maydonhoi vorid tarjima nameshavand
const SKIP = "script,style,textarea,input,code,pre,[contenteditable],[data-no-translate]";

export function getLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "ru" || v === "tg") return v;
  } catch {}
  return "en";
}

/** Zaboni nav: nigoh doshta, sahifa az nav bor meshavad (misli Instagram) — matni English boz megardad */
export function setLang(lang: Lang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {}
  window.location.reload();
}

export function useLang(): Lang {
  return useSyncExternalStore(
    () => () => {},
    getLang,
    () => "en",
  );
}

function translate(text: string, lang: Exclude<Lang, "en">): string | null {
  const key = normalize(text);
  if (!key) return null;
  const hit = DICT[lang].get(key);
  if (hit) return hit;
  for (const p of PATTERNS) {
    const m = key.match(p.re);
    if (m) return p[lang](m);
  }
  return null;
}

/** Fosilahoi atrofi matnro nigoh medorad ("Text " → "Matn ") */
function withSpaces(original: string, translated: string) {
  const lead = original.match(/^\s*/)![0];
  const trail = original.match(/\s*$/)![0];
  return lead + translated + trail;
}

// Kalidi fiber-i React dar DOM: element-i hydrate-shuda onro dorad. HTML-i serveri, ki React hanuz
// hydrate nakardaast (Suspense), tagyir doda nameshavad — vagarna xatoi "Hydration failed".
let fiberKey: string | undefined;
let skipped = false;

function isHydrated(el: Element) {
  fiberKey ??= Object.keys(document.body).find((k) => k.startsWith("__reactFiber$"));
  if (!fiberKey || fiberKey in el) return true;
  skipped = true;
  return false;
}

function translateAttrs(el: Element, lang: Exclude<Lang, "en">) {
  for (const attr of ATTRS) {
    const v = el.getAttribute(attr);
    if (!v) continue;
    const t = translate(v, lang);
    if (t && t !== v) el.setAttribute(attr, t);
  }
}

function translateText(node: Node, lang: Exclude<Lang, "en">) {
  const parent = node.parentElement;
  if (!parent || parent.closest(SKIP) || !isHydrated(parent)) return;
  const value = node.nodeValue ?? "";
  const t = translate(value, lang);
  if (t && normalize(value) !== t) node.nodeValue = withSpaces(value, t);
}

function translateNode(node: Node, lang: Exclude<Lang, "en">) {
  if (node.nodeType === Node.TEXT_NODE) return translateText(node, lang);
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const root = node as Element;
  if (root.closest("nextjs-portal,[data-no-translate]")) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n: Node | null = root; n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) translateText(n, lang);
    else if (isHydrated(n as Element)) translateAttrs(n as Element, lang);
  }
}

/**
 * Tarjimai hamai UI (English / Русский / Tojiki): matnho-i DOM pas az hydration ivaz meshavand,
 * MutationObserver sahifahoi nav, modal-ho va toast-hoi navro ham tarjima mekunad.
 * Faqat nodeValue / attribute ivaz meshavad (daraxti React vayron nameshavad), matni korbar tarjima nameshavad.
 */
export function Translator() {
  useEffect(() => {
    const lang = getLang();
    document.documentElement.lang = lang;
    if (lang === "en") return;
    let queued = new Set<Node>();
    let frame = 0;
    let retry = 0;
    let retries = 0;
    // Guzari purra; agar qisme hanuz hydrate nashuda bud — boz pas az 300 ms (to 30 bor)
    const fullPass = () => {
      skipped = false;
      translateNode(document.body, lang);
      if (skipped && retries++ < 30) retry = window.setTimeout(fullPass, 300);
    };
    fullPass();
    const flush = () => {
      frame = 0;
      const nodes = queued;
      queued = new Set();
      skipped = false;
      nodes.forEach((n) => n.isConnected && translateNode(n, lang));
      if (skipped && !retry) {
        retries = 0;
        retry = window.setTimeout(() => {
          retry = 0;
          fullPass();
        }, 300);
      }
    };
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "childList") r.addedNodes.forEach((n) => queued.add(n));
        else queued.add(r.target);
      }
      if (!frame) frame = requestAnimationFrame(flush);
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRS],
    });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(retry);
    };
  }, []);
  return null;
}
