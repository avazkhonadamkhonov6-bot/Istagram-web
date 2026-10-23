"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LANGS } from "@/lib/i18n/dictionary";
import { setLang, useLang } from "@/lib/i18n/translator";

/** Intixobi zaboni UI (misli "Language" dar Instagram): English, Русский, Tojiki */
export function LanguageDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const current = useLang();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] p-0">
        <header className="border-b border-ig-elevated-separator py-3 text-center">
          <DialogTitle>Language</DialogTitle>
          <DialogDescription className="sr-only">Choose the language of Instagram</DialogDescription>
        </header>
        <ul className="py-2" data-no-translate>
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => (l.code === current ? onOpenChange(false) : setLang(l.code))}
                aria-pressed={l.code === current}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-ig-hover-overlay"
              >
                <span className={l.code === current ? "font-semibold" : undefined}>{l.label}</span>
                {l.code === current ? <Check className="size-5 text-ig-primary" /> : null}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/** Dar footer-i sahifahoi vorid: "English ⌄" → intixobi zabon */
export function LanguageFooterButton() {
  const current = useLang();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center" data-no-translate>
        {LANGS.find((l) => l.code === current)?.label ?? "English"}
        <span className="mx-3">⌄</span>
      </button>
      <LanguageDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
