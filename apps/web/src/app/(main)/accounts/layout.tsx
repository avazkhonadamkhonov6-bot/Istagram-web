import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { SettingsNav } from "@/features/account/components/settings-nav";

export const metadata: Metadata = { title: "Settings" };

export default function AccountsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[935px] flex-col gap-6 px-4 py-6 md:flex-row md:py-8">
      <Suspense fallback={null}>
        <SettingsNav />
      </Suspense>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}