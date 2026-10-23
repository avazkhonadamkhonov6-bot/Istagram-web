"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordQuerySchema } from "@repo/shared";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { useChangePassword } from "../hooks";

type PasswordForm = {
  OldPassword: string;
  Password: string;
  ConfirmPassword: string;
};

export function ChangePasswordForm() {
  const change = useChangePassword();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<PasswordForm>({
    resolver: zodResolver(changePasswordQuerySchema),
    mode: "onChange",
    defaultValues: { OldPassword: "", Password: "", ConfirmPassword: "" },
  });

  const onSubmit = (values: PasswordForm) => {
    setMessage(null);
    setError(null);
    change.mutate(values, {
      onSuccess: () => {
        reset();
        setMessage("Password changed.");
      },
      onError: (err) =>
        setError(
          err instanceof ApiError ? err.message : "Could not change password.",
        ),
    });
  };

  return (
    <div className="max-w-[500px] space-y-6">
      <h1 className="text-xl font-semibold">Change password</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <Input
          type="password"
          label="Old password"
          autoComplete="current-password"
          error={errors.OldPassword?.message}
          {...register("OldPassword")}
        />
        <Input
          type="password"
          label="New password"
          autoComplete="new-password"
          error={errors.Password?.message}
          {...register("Password")}
        />
        <Input
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.ConfirmPassword?.message}
          {...register("ConfirmPassword")}
        />
        <Link href="/accounts/password/reset" className="block text-sm font-semibold text-ig-link">
          Forgot your password?
        </Link>
        <Button
          type="submit"
          variant="primary"
          disabled={!isValid || change.isPending}
        >
          Change password
        </Button>
        {message ? (
          <p role="status" className="text-sm text-ig-success">
            {message}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-ig-error">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}