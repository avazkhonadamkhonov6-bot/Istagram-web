import type { Metadata } from "next";
import { Suspense } from "react";
import SignupPage from "@/features/auth/components/signup-page";
import { Spinner } from "@/components/ui/spinner";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Sign up for Instagram to see photos and videos from your friends.",
  alternates: { canonical: "/signup" },
};

export const instant = false;

export default function Page() {
  return <Suspense fallback={<div className="grid min-h-dvh place-items-center"><Spinner /></div>}><SignupPage /></Suspense>;
}
