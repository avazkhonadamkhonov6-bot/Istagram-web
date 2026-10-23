"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordQuerySchema, resetPasswordQuerySchema } from "@repo/shared";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AuthFooter } from "@/features/auth/components/auth-presentation";
import * as authApi from "@/features/auth/api";
import { ApiError } from "@/lib/api-client";

type EmailForm = { Email: string };
type ResetForm = { Email: string; Token: string; Password: string; ConfirmPassword: string };

/**
 * /accounts/password/reset — "Trouble logging in?" misli instagram.com (Spec 12: ForgotPassword / ResetPassword).
 * Qadami 1: e-mail → kod ba e-mail; qadami 2: kod + paroli nav; qadami 3: tayyor.
 */
export default function ResetPasswordPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <div className="auth-page">
      <div className="auth-column auth-signup">
        <div className="auth-card text-center">
          <span className="mb-4 flex size-24 items-center justify-center rounded-full border-[3px] border-ig-text">
            <Lock className="size-11" strokeWidth={1.5} />
          </span>
          {done ? (
            <Done />
          ) : email ? (
            <CodeStep email={email} onBack={() => setEmail(null)} onDone={() => setDone(true)} />
          ) : (
            <EmailStep onSent={setEmail} />
          )}
        </div>
        <div className="auth-switch">
          <Link href="/login" className="font-semibold">
            Back to login
          </Link>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<EmailForm>({ resolver: zodResolver(forgotPasswordQuerySchema), mode: "onChange", defaultValues: { Email: "" } });

  const onSubmit = async ({ Email }: EmailForm) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(Email);
      onSent(Email);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Couldn't send code. Try again.");
    }
  };

  return (
    <>
      <h1 className="text-base font-semibold">Trouble logging in?</h1>
      <p className="mb-4 mt-2 text-sm text-ig-text-secondary">
        Enter your email and we&apos;ll send you a code to get back into your account.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="auth-form flex w-full flex-col" noValidate>
        <Input type="email" label="Email" autoComplete="email" error={errors.Email?.message} {...register("Email")} />
        <Button type="submit" variant="primary" disabled={!isValid || isSubmitting} className="mt-2 w-full">
          {isSubmitting ? <Spinner className="size-4" /> : "Send code"}
        </Button>
        {serverError && (
          <p role="alert" className="mt-3 text-xs text-ig-error">
            {serverError}
          </p>
        )}
      </form>
      <div className="auth-divider">
        <span />
        OR
        <span />
      </div>
      <Link href="/signup" className="text-sm font-semibold">
        Create new account
      </Link>
    </>
  );
}

function CodeStep({ email, onBack, onDone }: { email: string; onBack: () => void; onDone: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetPasswordQuerySchema),
    mode: "onChange",
    defaultValues: { Email: email, Token: "", Password: "", ConfirmPassword: "" },
  });

  const onSubmit = async (values: ResetForm) => {
    setServerError(null);
    try {
      await authApi.resetPassword(values);
      onDone();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Couldn't reset password. Try again.");
    }
  };

  return (
    <>
      <h1 className="text-base font-semibold">Enter confirmation code</h1>
      <p className="mb-4 mt-2 text-sm text-ig-text-secondary">
        Enter the code we sent to <span className="font-semibold text-ig-text">{email}</span> and choose a new password.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="auth-form flex w-full flex-col" noValidate>
        <input type="hidden" {...register("Email")} />
        <Input label="Code" autoComplete="one-time-code" error={errors.Token?.message} {...register("Token")} />
        <Input type="password" label="New password" autoComplete="new-password" error={errors.Password?.message} {...register("Password")} />
        <Input
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.ConfirmPassword?.message}
          {...register("ConfirmPassword")}
        />
        <Button type="submit" variant="primary" disabled={!isValid || isSubmitting} className="mt-2 w-full">
          {isSubmitting ? <Spinner className="size-4" /> : "Reset password"}
        </Button>
        {serverError && (
          <p role="alert" className="mt-3 text-xs text-ig-error">
            {serverError}
          </p>
        )}
      </form>
      <div className="mt-4 flex w-full justify-between text-sm">
        <button type="button" onClick={onBack} className="font-semibold">
          Change email
        </button>
        <button
          type="button"
          disabled={resent}
          onClick={() => authApi.forgotPassword(email).then(() => setResent(true)).catch(() => undefined)}
          className="font-semibold text-ig-link disabled:text-ig-text-secondary"
        >
          {resent ? "Code sent" : "Resend code"}
        </button>
      </div>
    </>
  );
}

function Done() {
  const router = useRouter();
  return (
    <>
      <h1 className="text-base font-semibold">Password reset</h1>
      <p className="mb-4 mt-2 text-sm text-ig-text-secondary">Your password has been changed. Log in with your new password.</p>
      <Button variant="primary" className="w-full" onClick={() => router.push("/login")}>
        Log in
      </Button>
    </>
  );
}
