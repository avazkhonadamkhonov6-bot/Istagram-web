"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { getLang } from "@/lib/i18n/translator";
import { cn } from "@/lib/utils";

type Translation = { text: string; source: string };

const translate = (text: string) =>
  api<Translation>("/translate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, to: getLang() }),
  });

/**
 * "See translation" misli Instagram: zeri har caption / comment alohida.
 * Click → tarjima ba zaboni UI (English / Русский / Tojiki), boz click → "Hide translation".
 */
export function SeeTranslation({ text, className, onMedia }: { text: string | null | undefined; className?: string; onMedia?: boolean }) {
  const [shown, setShown] = useState(false);
  const run = useMutation({ mutationFn: () => translate(text ?? "") });
  // Faqat matni bo harf (na faqat emoji / #tag / @user)
  if (!text || !/\p{L}{2,}/u.test(text.replace(/[#@][\p{L}\p{N}_.]+/gu, ""))) return null;

  const toggle = () => {
    if (shown) return setShown(false);
    setShown(true);
    if (!run.data && !run.isPending) run.mutate();
  };

  return (
    <div className={cn("text-xs", className)}>
      <button
        type="button"
        onClick={toggle}
        className={cn("font-semibold", onMedia ? "text-ig-text-on-media/80" : "text-ig-text-secondary")}
      >
        {shown ? "Hide translation" : "See translation"}
      </button>
      {shown ? (
        <p className={cn("mt-1 whitespace-pre-line break-words text-sm", onMedia ? "text-ig-text-on-media" : "text-ig-text")} data-no-translate>
          {run.isPending ? (
            <span className="text-ig-text-secondary">Translating...</span>
          ) : run.isError ? (
            <button type="button" onClick={() => run.mutate()} className="text-ig-error">
              Couldn&apos;t translate. Try again.
            </button>
          ) : (
            run.data?.text
          )}
        </p>
      ) : null}
    </div>
  );
}
