"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginDto } from "@repo/shared";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { InstagramGlyph } from "@/components/ui/instagram-glyph";
import { AuthFooter, LoginPresentation } from "@/features/auth/components/auth-presentation";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import * as authApi from "@/features/auth/api";
import { authKeys } from "@/features/auth/hooks";
import { ApiError } from "@/lib/api-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      userName: "",
      password: "",
    },
  });

  const passwordVal = useWatch({ control, name: "password" });

  const onSubmit = async (values: LoginDto) => {
    setServerError(null);
    try {
      const profile = await authApi.login({
        userName: values.userName.trim().toLowerCase(),
        password: values.password,
      });
      qc.setQueryData(authKeys.me, profile);
      const requestedNext = searchParams.get("next");
      const nextUrl =
        requestedNext?.startsWith("/") &&
        !requestedNext.startsWith("//") &&
        !requestedNext.includes("\\")
          ? requestedNext
          : "/";
      router.replace(nextUrl);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(
          err.errors[0] ||
            "Sorry, your password was incorrect. Please double-check your password.",
        );
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="auth-page login-page">
      <Link href="/login" aria-label="Instagram" className="login-brand"><InstagramGlyph gradient /></Link>
      <div className="auth-main">
        <LoginPresentation />
        {/* Responsive authentication card. */}
        <div className="auth-column">
          <div className="auth-card">
            <h1 className="login-heading">Log into Instagram</h1>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="auth-form flex w-full flex-col gap-1.5"
              noValidate
            >
              <Input
                label="Username"
                autoComplete="username"
                aria-label="Username"
                error={errors.userName?.message}
                {...register("userName")}
              />

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  autoComplete="current-password"
                  aria-label="Password"
                  error={errors.password?.message}
                  className={passwordVal ? "pr-14" : ""}
                  {...register("password")}
                />
                {passwordVal ? (
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-3.5 text-sm font-semibold text-ig-text hover:opacity-70"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                ) : null}
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={!isValid || isSubmitting}
                className="mt-2 h-8 w-full"
              >
                {isSubmitting ? <Spinner className="size-4" /> : "Log in"}
              </Button>

              {serverError ? (
                <p
                  role="alert"
                  className="mt-3 text-center text-xs text-ig-error"
                >
                  {serverError}
                </p>
              ) : null}
              <Link href="/accounts/password/reset" className="mt-4 block text-center text-sm font-semibold">
                Forgot password?
              </Link>
            </form>
            <div className="login-account-actions">
              <Link href="/signup" className="login-create-account">Create new account</Link>
              <div className="login-meta"><svg viewBox="0 0 32 20" aria-hidden="true"><path d="M2 14C2 3 8 1 13 9l6 8c5 5 11 0 11-7S23-1 18 7L9 17C5 21 2 18 2 14Z" fill="none" stroke="currentColor" strokeWidth="2.5" /></svg>Meta</div>
            </div>
          </div>


        </div>
      </div>
      <AuthFooter />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ig-bg">
          <Spinner />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
