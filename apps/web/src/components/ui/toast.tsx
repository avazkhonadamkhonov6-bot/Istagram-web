"use client";

import { Toaster as Sonner, toast } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-xl bg-ig-toast px-4 py-3 text-sm text-ig-text-on-color shadow-ig-strong",
          title: "font-medium",
          description: "text-xs opacity-80",
        },
      }}
    />
  );
}

export { toast };