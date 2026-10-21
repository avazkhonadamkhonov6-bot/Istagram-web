import {
  userProfileSchema,
  type UpdateUserProfileDto,
  type UserProfile,
} from "@repo/shared";
import { api } from "@/lib/api-client";

export const updateProfile = (dto: UpdateUserProfileDto) =>
  api<UserProfile>("/UserProfile/update-user-profile", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
    schema: userProfileSchema,
  });

export const uploadAvatar = (file: File) => {
  const form = new FormData();
  form.append("imageFile", file);
  return api<UserProfile>("/UserProfile/update-user-image-profile", {
    method: "PUT",
    body: form,
    schema: userProfileSchema,
  });
};

export const deleteAvatar = () =>
  api<UserProfile>("/UserProfile/delete-user-image-profile", {
    method: "DELETE",
    schema: userProfileSchema,
  });

export const changePassword = (query: {
  OldPassword: string;
  Password: string;
  ConfirmPassword: string;
}) =>
  api<string>(`/Account/ChangePassword?${new URLSearchParams(query)}`, {
    method: "PUT",
  });