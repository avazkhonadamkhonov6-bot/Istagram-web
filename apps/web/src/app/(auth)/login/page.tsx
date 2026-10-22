import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPage from "@/features/auth/components/login-page";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to Instagram to see photos and videos from your friends, share moments and chat in Direct.",
  alternates: { canonical: "/login" },
};

export const instant = false;

export default function Page() {
  return <Suspense fallback={<div className="grid min-h-dvh place-items-center"><Spinner /></div>}><LoginPage /></Suspense>;
}
