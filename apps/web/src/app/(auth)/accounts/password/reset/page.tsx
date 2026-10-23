import type { Metadata } from "next";
import ResetPasswordPage from "@/features/auth/components/reset-password-page";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Get back into your Instagram account.",
  robots: { index: false },
};

export const instant = false;

export default function Page() {
  return <ResetPasswordPage />;
}
