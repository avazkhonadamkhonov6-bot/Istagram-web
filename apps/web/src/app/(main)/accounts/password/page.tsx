import { ChangePasswordForm } from "@/features/account/components/change-password-form";

// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;

export default function PasswordPage() {
  return <ChangePasswordForm />;
}