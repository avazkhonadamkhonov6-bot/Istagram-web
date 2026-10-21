"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginDto } from "@repo/shared";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send } from "@/components/ui/icons";
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
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      userName: "",
      password: "",
    },
  });

  const passwordVal = watch("password");

  const onSubmit = async (values: LoginDto) => {
    setServerError(null);
    try {
      const profile = await authApi.login({
        userName: values.userName.trim().toLowerCase(),
        password: values.password,
      });
      qc.setQueryData(authKeys.me, profile);
      const nextUrl = searchParams.get("next") || "/";
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
    <div className="flex min-h-screen items-center justify-center bg-ig-bg-secondary px-4 py-10">
      <div className="flex items-center justify-center gap-8">
        {/* Левая колонка: макет телефона на десктопе (Spec 10 §4) */}
        <div className="hidden h-[580px] w-[380px] flex-col justify-between rounded-[36px] border-4 border-ig-stroke bg-ig-bg p-5 shadow-ig-strong lg:flex">
          <div className="flex items-center justify-between border-b border-ig-separator pb-3">
            <span className="font-logo text-2xl">Instagram</span>
            <div className="flex items-center gap-3 text-ig-text">
              <Heart className="size-5" />
              <Send className="size-5" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-ig-bg-secondary ring-2 ring-ig-primary" />
              <div>
                <div className="text-xs font-semibold">pamir.travel</div>
                <div className="text-[11px] text-ig-text-secondary">
                  Dushanbe, Tajikistan
                </div>
              </div>
            </div>
            <div
              className="aspect-[4/5] w-full rounded-lg border border-ig-separator"
              style={{ background: "var(--ig-brand-gradient)" }}
            />
            <div className="flex items-center gap-3 pt-1">
              <Heart className="size-5 text-ig-badge" fill="currentColor" />
              <MessageCircle className="size-5" />
              <Send className="size-5" />
            </div>
            <p className="text-xs">
              <span className="font-semibold">pamir.travel</span> Welcome to
              Instagram Web
            </p>
          </div>

          <div className="h-1 w-28 self-center rounded-full bg-ig-separator" />
        </div>

        {/* Правая колонка: карточка 350px (Spec 10 §4) */}
        <div className="flex w-[350px] flex-col gap-3">
          <div className="flex flex-col items-center rounded-sm border border-ig-stroke bg-ig-bg px-10 pb-8 pt-10">
            <h1 className="mb-8 font-logo text-5xl leading-none">Instagram</h1>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex w-full flex-col gap-2"
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
                    className="absolute right-3 top-2.5 text-xs font-semibold text-ig-text hover:opacity-70"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                ) : null}
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={!isValid || isSubmitting}
                className="mt-2 w-full"
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
            </form>
          </div>

          <div className="flex items-center justify-center gap-1 rounded-sm border border-ig-stroke bg-ig-bg py-5 text-sm">
            <span>Don&apos;t have an account?</span>
            <Link
              href="/signup"
              className="font-semibold text-ig-link-action hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
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