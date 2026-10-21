import { Suspense } from "react";
import { OfflineBanner } from "@/components/offline-banner";
import { Spinner } from "@/components/ui/spinner";
import { DirectShell } from "@/features/direct/components/direct-shell";
import { QueryProvider } from "@/lib/providers";
import "./direct.css";

export default function DirectLayout({ children }: LayoutProps<"/direct">) {
  return (
    <QueryProvider>
      <OfflineBanner />
      {/* useParams dar DirectShell — faqat dar runtime (cacheComponents) */}
      <Suspense
        fallback={
          <div className="flex h-dvh items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <DirectShell>{children}</DirectShell>
      </Suspense>
    </QueryProvider>
  );
}
