import { connection } from "next/server";
import type { Metadata, Viewport } from "next";
import { Grand_Hotel } from "next/font/google";
import { OfflineBanner } from "@/components/offline-banner";
import { Toaster } from "@/components/ui/toast";
import { QueryProvider } from "@/lib/providers";
import "./globals.css";
import "./instagram.css";
import "./reference-style.css";

const grandHotel = Grand_Hotel({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-grand-hotel",
  display: "swap",
});

// Nonce CSP needs request-rendered HTML, including bootstrap scripts.
export const instant = false;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const DESCRIPTION =
  "Create an account or log in to Instagram - share what you are into with the people who get you: photos, reels, stories and Direct messages.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Instagram", template: "%s • Instagram" },
  description: DESCRIPTION,
  applicationName: "Instagram",
  keywords: ["Instagram", "photos", "reels", "stories", "Direct", "social network"],
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "Instagram",
    title: "Instagram",
    description: DESCRIPTION,
    url: "/",
    images: [{ url: "/auth/friends.jpg", width: 1200, height: 630, alt: "Instagram" }],
  },
  twitter: { card: "summary_large_image", title: "Instagram", description: DESCRIPTION, images: ["/auth/friends.jpg"] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0C1014" },
  ],
  colorScheme: "dark light",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  return (
    <html lang="en" suppressHydrationWarning className={`${grandHotel.variable} dark h-full antialiased`}>
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
