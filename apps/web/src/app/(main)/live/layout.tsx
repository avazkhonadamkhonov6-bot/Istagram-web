/**
 * Efiri mustaqim (Spec 16 §3) — faqat dar runtime (kamera, socket).
 * Layout-i (main) `usePathname()`-ro berun az <Suspense> istifoda mebarad, baroi hamin prerender man ast.
 */
export const instant = false;

export default function LiveLayout({ children }: LayoutProps<"/live">) {
  return children;
}
