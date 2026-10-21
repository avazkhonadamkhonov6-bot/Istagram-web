import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { DirectShell } from "@/features/direct/components/direct-shell";
import { QueryProvider } from "@/lib/providers";

export default function DirectLayout({ children }: LayoutProps<"/direct">) {
  return (
    <QueryProvider>
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
