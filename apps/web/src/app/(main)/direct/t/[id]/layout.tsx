/**
 * Chat — route-i dinamiki, faqat dar runtime sohta meshavad.
 * Layout-i (main) `usePathname()`-ro berun az <Suspense> istifoda mebarad (sidebar, bottom nav),
 * baroi hamin prerender-i in route man ast (Next 16, cacheComponents).
 */
export const instant = false;

export default function ThreadLayout({ children }: LayoutProps<"/direct/t/[id]">) {
  return children;
}
