import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { DirectShell } from "@/features/direct/components/direct-shell";
import "./direct.css";

export default function DirectLayout({ children }: LayoutProps<"/direct">) {
  return (
    <>
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
    </>
  );
}
