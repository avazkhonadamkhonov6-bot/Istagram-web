import {
  RESERVED_USERNAMES,
  userListItemSchema,
  userProfileSchema,
  type LoginDto,
  type RegisterDto,
  type UserListItem,
  type UserProfile,
} from "@repo/shared";
import { api } from "@/lib/api-client";

export const getMyProfile = () =>
  api<UserProfile>("/UserProfile/get-my-profile", {
    schema: userProfileSchema,
  });

export const login = (dto: LoginDto) =>
  api<UserProfile>("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
    schema: userProfileSchema,
  });

export const register = (dto: RegisterDto) =>
  api<UserProfile>("/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dto),
    schema: userProfileSchema,
  });

export const logout = () => api<boolean>("/auth/logout", { method: "POST" });

type Paged<T> = { data: T[] };

/** Проверка свободного username (Spec 01 / Spec 12 §2–3) */
export async function checkUsernameAvailable(rawUsername: string): Promise<{
  available: boolean;
  reason?: "RESERVED" | "TAKEN" | "UNAVAILABLE";
}> {
  const normalized = rawUsername.trim().toLowerCase();
  if (!normalized || normalized.length < 3) {
    return { available: false };
  }
  if ((RESERVED_USERNAMES as readonly string[]).includes(normalized)) {
    return { available: false, reason: "RESERVED" };
  }

  const res = await fetch(
    `/api/User/get-users?UserName=${encodeURIComponent(normalized)}&PageSize=20`,
    { credentials: "same-origin" },
  );
  if (!res.ok) return { available: false, reason: "UNAVAILABLE" };

  const body = (await res.json().catch(() => null)) as Paged<unknown> | null;
  const parsed = userListItemSchema.array().safeParse(body?.data ?? []);
  if (!parsed.success) return { available: false, reason: "UNAVAILABLE" };
  const items: UserListItem[] = parsed.data;
  const taken = items.some((u) => u.userName.toLowerCase() === normalized);

  return taken ? { available: false, reason: "TAKEN" } : { available: true };
}

/** Spec 12: kodi ivazi parol ba e-mail (javob hamesha yakxela) */
export const forgotPassword = (email: string) =>
  api<string>(`/Account/ForgotPassword?${new URLSearchParams({ Email: email })}`, { method: "DELETE" });

export const resetPassword = (q: { Email: string; Token: string; Password: string; ConfirmPassword: string }) =>
  api<string>(`/Account/ResetPassword?${new URLSearchParams(q)}`, { method: "DELETE" });
