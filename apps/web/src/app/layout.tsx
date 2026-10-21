import type { Metadata } from "next";
import { Grand_Hotel } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const grandHotel = Grand_Hotel({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-grand-hotel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Instagram",
  description: "Instagram Web Clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${grandHotel.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ig-bg text-ig-text">
        {children}
        <Toaster />
      </body>
    </html>
  );
}