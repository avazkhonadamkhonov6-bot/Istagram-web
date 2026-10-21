"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateUserProfileSchema,
  type UpdateUserProfileDto,
  type UserProfile,
} from "@repo/shared";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/auth/hooks";
import { SmallAvatar } from "@/features/feed/components/small-avatar";
import { ApiError } from "@/lib/api-client";
import { mediaUrl } from "@/lib/media";
import {
  useDeleteAvatar,
  useUpdateProfile,
  useUploadAvatar,
} from "../hooks";

const ABOUT_MAX = 150;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function Form({ me }: { me: UserProfile }) {
  const update = useUpdateProfile();
  const upload = useUploadAvatar();
  const remove = useDeleteAvatar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateUserProfileDto>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: { about: me.about ?? "", gender: me.gender === 1 ? 1 : 0 },
  });
  const about = useWatch({ control, name: "about" }) ?? "";

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMessage(null);
    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Use a JPEG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("The image must be 10 MB or smaller.");
      return;
    }
    setError(null);
    upload.mutate(file, {
      onSuccess: () => setMessage("Photo updated."),
      onError: (err) =>
        setError(err instanceof ApiError ? err.message : "Upload failed."),
    });
  };

  const onSubmit = (values: UpdateUserProfileDto) => {
    setMessage(null);
    setError(null);
    update.mutate(values, {
      onSuccess: (profile) => {
        reset({
          about: profile.about ?? "",
          gender: profile.gender === 1 ? 1 : 0,
        });
        setMessage("Profile saved.");
      },
      onError: (err) =>
        setError(err instanceof ApiError ? err.message : "Could not save."),
    });
  };

  return (
    <div className="max-w-[500px] space-y-6">
      <h1 className="text-xl font-semibold">Edit profile</h1>

      <div className="flex items-center gap-4 rounded-xl bg-ig-bg-secondary p-4">
        <SmallAvatar
          src={mediaUrl(me.image)}
          name={me.userName}
          className="size-14 text-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{me.userName}</p>
          <p className="truncate text-sm text-ig-text-secondary">
            {me.fullName}
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          onChange={onPickFile}
          className="hidden"
          aria-label="Profile photo"
        />
        <Button
          type="button"
          variant="primary"
          disabled={upload.isPending}
          onClick={() => fileRef.current?.click()}
        >
          Change photo
        </Button>
        {me.image ? (
          <Button
            type="button"
            variant="secondary"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(undefined, {
                onSuccess: () => setMessage("Photo removed."),
              })
            }
          >
            Remove
          </Button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Username" value={me.userName} readOnly disabled />
        <Input label="Name" value={me.fullName ?? ""} readOnly disabled />
        <p className="text-xs text-ig-text-secondary">
          Username and name cannot be changed yet.
        </p>

        <div>
          <label htmlFor="about" className="mb-1 block text-sm font-semibold">
            Bio
          </label>
          <textarea
            id="about"
            rows={3}
            maxLength={ABOUT_MAX}
            className="w-full resize-none rounded-xl border border-ig-input-border bg-ig-bg px-3 py-2 text-sm outline-none focus:border-ig-input-border-focus"
            {...register("about")}
          />
          <div className="flex justify-between text-xs">
            <span className="text-ig-error">{errors.about?.message}</span>
            <span className="text-ig-text-secondary">
              {about.length} / {ABOUT_MAX}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="gender" className="mb-1 block text-sm font-semibold">
            Gender
          </label>
          <select
            id="gender"
            className="w-full rounded-xl border border-ig-input-border bg-ig-bg px-3 py-3 text-sm outline-none focus:border-ig-input-border-focus"
            {...register("gender", { valueAsNumber: true })}
          >
            <option value={0}>Male</option>
            <option value={1}>Female</option>
          </select>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={!isDirty || update.isPending}
        >
          Submit
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

export function EditProfileForm() {
  const { data: me, isPending } = useMe();

  if (isPending) {
    return (
      <div className="max-w-[500px] space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }
  if (!me) return null;

  return <Form key={me.userId} me={me} />;
}