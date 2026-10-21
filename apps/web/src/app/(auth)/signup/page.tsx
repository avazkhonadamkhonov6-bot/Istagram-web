import { Suspense } from "react";
import SignupPage from "@/features/auth/components/signup-page";
import { Spinner } from "@/components/ui/spinner";

export const instant = false;

export default function Page() {
  return <Suspense fallback={<div className="grid min-h-dvh place-items-center"><Spinner /></div>}><SignupPage /></Suspense>;
}
