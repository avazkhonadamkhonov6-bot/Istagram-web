import { connection } from "next/server";
import type { Metadata } from "next";
import { Grand_Hotel } from "next/font/google";
import { OfflineBanner } from "@/components/offline-banner";
import { Toaster } from "@/components/ui/toast";
import { QueryProvider } from "@/lib/providers";
import "./globals.css";
import "./instagram.css";

const grandHotel = Grand_Hotel({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-grand-hotel",
  display: "swap",
});

// Nonce CSP needs request-rendered HTML, including bootstrap scripts.
export const instant = false;

export const metadata: Metadata = {
  title: "Instagram",
  description: "Instagram Web Clone",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  return (
    <html lang="en" className={`${grandHotel.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ig-bg text-ig-text">
        <QueryProvider>
          <OfflineBanner />
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
