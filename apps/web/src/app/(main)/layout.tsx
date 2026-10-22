import { Suspense, type ReactNode } from "react";
import { BackendStatus } from "@/components/backend-status";
import { MessagesDock } from "@/components/layout/messages-dock";
import { CreateLauncher } from "@/components/layout/create-launcher";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { SidePanel } from "@/components/layout/side-panel";
import { TopBar } from "@/components/layout/top-bar";

export const instant = false;

export default function MainLayout({
  children,
  modal,
}: Readonly<{ children: ReactNode; modal: ReactNode }>) {
  return (
    <>
      <Suspense fallback={null}>
        <Sidebar />
        <TopBar />
        <SidePanel />
      </Suspense>
      <main className="ig-main min-w-0 flex-1 pb-[50px] pt-[60px] md:ml-[72px] md:pb-0 md:pt-0">
        <BackendStatus />
        {children}
      </main>
      {modal}
      <CreateLauncher />
      <Suspense fallback={null}>
        <BottomNav />
        <MessagesDock />
      </Suspense>
    </>
  );
}