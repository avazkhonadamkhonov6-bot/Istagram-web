"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, userNameSchema, type RegisterDto } from "@repo/shared";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Check, X } from "@/components/ui/icons";
import { Wordmark } from "@/components/ui/wordmark";
import { AuthFooter } from "@/features/auth/components/auth-presentation";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import * as authApi from "@/features/auth/api";
import { authKeys } from "@/features/auth/hooks";
import { ApiError } from "@/lib/api-client";

type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "reserved"
  | "unavailable";

export default function SignupPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

  const {
    register,
    handleSubmit,
    control,
    setError,
    clearErrors,
    formState: { errors, isValid, isSubmitting },
  } = useForm<RegisterDto>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      fullName: "",
      userName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const watchedUsername = useWatch({ control, name: "userName" });

  // Проверка доступности username с debounce 400ms (Spec 01 / FE-06)
  useEffect(() => {
    const normalized = (watchedUsername ?? "").trim().toLowerCase();
    if (!normalized || !userNameSchema.safeParse(normalized).success) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await authApi.checkUsernameAvailable(normalized);
        if (cancelled) return;
        if (res.reason === "UNAVAILABLE") {
          setUsernameStatus("unavailable");
          clearErrors("userName");
        } else if (res.available) {
          setUsernameStatus("available");
          clearErrors("userName");
        } else if (res.reason === "RESERVED") {
          setUsernameStatus("reserved");
          setError("userName", {
            type: "manual",
            message: "USERNAME_RESERVED: This username is reserved",
          });
        } else {
          setUsernameStatus("taken");
          setError("userName", {
            type: "manual",
            message: "USERNAME_TAKEN: This username isn't available",
          });
        }
      } catch {
        if (!cancelled) setUsernameStatus("unavailable");
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [watchedUsername, setError, clearErrors]);

  const onSubmit = async (values: RegisterDto) => {
    if (usernameStatus === "taken" || usernameStatus === "reserved") return;
    setServerError(null);
    try {
      const profile = await authApi.register({
        ...values,
        userName: values.userName.trim().toLowerCase(),
        email: values.email.trim().toLowerCase(),
        fullName: values.fullName.trim(),
      });
      qc.setQueryData(authKeys.me, profile);
      router.replace("/");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409 || err.code === "USERNAME_TAKEN") {
          setUsernameStatus("taken");
          setError("userName", {
            type: "manual",
            message: "USERNAME_TAKEN: This username isn't available",
          });
        } else {
          setServerError(err.errors[0] || "Registration failed");
        }
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  };

  const canSubmit =
    isValid &&
    !isSubmitting &&
    usernameStatus !== "checking" &&
    usernameStatus !== "taken" &&
    usernameStatus !== "reserved";

  return (
    <div className="auth-page">
      <div className="auth-column auth-signup">
        <div className="auth-card">
          <h1 className="mb-3"><Wordmark /></h1>
          <p className="mb-6 text-center text-base font-semibold text-ig-text-secondary">
            Sign up to see photos and videos from your friends.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="auth-form flex w-full flex-col gap-1.5"
            noValidate
          >
            <Input
              type="email"
              label="Email"
              autoComplete="email"
              aria-label="Email"
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Full Name"
              autoComplete="name"
              aria-label="Full Name"
              error={errors.fullName?.message}
              {...register("fullName")}
            />

            <div className="relative">
              <Input
                label="Username"
                autoComplete="username"
                aria-label="Username"
                error={errors.userName?.message}
                className="pr-9"
                {...register("userName", {
                  onChange: (event) => {
                    clearErrors("userName");
                    setUsernameStatus(
                      userNameSchema.safeParse(
                        event.target.value.trim().toLowerCase(),
                      ).success
                        ? "checking"
                        : "idle",
                    );
                  },
                })}
              />
              <div className="pointer-events-none absolute right-3 top-4 flex items-center">
                {usernameStatus === "checking" ? (
                  <Spinner className="size-4" />
                ) : usernameStatus === "available" ? (
                  <Check
                    aria-label="Username available"
                    className="size-4 text-ig-success"
                  />
                ) : usernameStatus === "taken" ||
                  usernameStatus === "reserved" ? (
                  <X
                    aria-label="Username unavailable"
                    className="size-4 text-ig-error"
                  />
                ) : null}
              </div>
            </div>

            <Input
              type="password"
              label="Password (min 8 chars)"
              autoComplete="new-password"
              aria-label="Password"
              error={errors.password?.message}
              {...register("password")}
            />

            <Input
              type="password"
              label="Confirm Password"
              autoComplete="new-password"
              aria-label="Confirm Password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <p className="my-3 text-center text-xs leading-4 text-ig-text-secondary">
              By signing up, you agree to our <a href="https://help.instagram.com/581066165581870/" className="text-ig-link">Terms</a>, <a href="https://privacycenter.instagram.com/policy/" className="text-ig-link">Privacy Policy</a> and Cookies Policy.
            </p>
            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit}
              className="mt-2 h-8 w-full"
            >
              {isSubmitting ? <Spinner className="size-4" /> : "Sign up"}
            </Button>

            {serverError ? (
              <p
                role="alert"
                className="mt-2 text-center text-xs text-ig-error"
              >
                {serverError}
              </p>
            ) : null}
          </form>
        </div>

        <div className="auth-switch">
          <span>Have an account?</span>
          <Link
            href="/login"
            className="font-semibold text-ig-link-action hover:underline"
          >
            Log in
          </Link>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
}
