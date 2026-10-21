import { Suspense } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { SidePanel } from "@/components/layout/side-panel";
import { TopBar } from "@/components/layout/top-bar";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Suspense fallback={null}>
        <Sidebar />
        <TopBar />
        <SidePanel />
      </Suspense>
      <main className="flex-1 pb-[50px] pt-[60px] md:ml-[72px] md:pb-0 md:pt-0 min-[1264px]:ml-[245px]">
        {children}
      </main>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </>
  );
}