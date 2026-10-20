import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { SidePanel } from "@/components/layout/side-panel";
import { TopBar } from "@/components/layout/top-bar";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Sidebar />
      <TopBar />
      <SidePanel />
      <main className="flex-1 pb-[50px] pt-[60px] md:ml-[72px] md:pb-0 md:pt-0 min-[1264px]:ml-[245px]">
        {children}
      </main>
      <BottomNav />
    </>
  );
}