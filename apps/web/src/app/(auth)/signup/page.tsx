"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  userNameSchema,
  type RegisterDto,
} from "@repo/shared";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Check, X } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import * as authApi from "@/features/auth/api";
import { authKeys } from "@/features/auth/hooks";
import { ApiError } from "@/lib/api-client";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "reserved";

export default function SignupPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

  const {
    register,
    handleSubmit,
    watch,
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

  const watchedUsername = watch("userName");

  // Проверка доступности username с debounce 400ms (Spec 01 / FE-06)
  useEffect(() => {
    const normalized = (watchedUsername ?? "").trim().toLowerCase();
    if (!normalized || !userNameSchema.safeParse(normalized).success) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await authApi.checkUsernameAvailable(normalized);
        if (res.available) {
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
        setUsernameStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
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
    <div className="flex min-h-screen items-center justify-center bg-ig-bg-secondary px-4 py-10">
      <div className="flex w-[350px] flex-col gap-3">
        <div className="flex flex-col items-center rounded-sm border border-ig-stroke bg-ig-bg px-10 pb-8 pt-10">
          <h1 className="mb-3 font-logo text-5xl leading-none">Instagram</h1>
          <p className="mb-6 text-center text-sm font-semibold text-ig-text-secondary">
            Sign up to see photos and videos from your friends.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full flex-col gap-2.5"
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
                {...register("userName")}
              />
              <div className="pointer-events-none absolute right-2.5 top-2.5 flex items-center">
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

            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit}
              className="mt-2 w-full"
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

        <div className="flex items-center justify-center gap-1 rounded-sm border border-ig-stroke bg-ig-bg py-5 text-sm">
          <span>Have an account?</span>
          <Link
            href="/login"
            className="font-semibold text-ig-link-action hover:underline"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}