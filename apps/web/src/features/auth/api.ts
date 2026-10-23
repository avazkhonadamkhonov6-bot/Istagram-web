import {
  RESERVED_USERNAMES,
  usernameAvailabilitySchema,
  userProfileSchema,
  type LoginDto,
  type RegisterDto,
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

/** Public check. Registration handles races with a final 409 response. */
export async function checkUsernameAvailable(rawUsername: string): Promise<{
  available: boolean;
  reason?: "RESERVED" | "TAKEN" | "UNAVAILABLE";
}> {
  const normalized = rawUsername.trim().toLowerCase();
  if ((RESERVED_USERNAMES as readonly string[]).includes(normalized))
    return { available: false, reason: "RESERVED" };
  try {
    return await api(
      `/Account/username-available?${new URLSearchParams({ UserName: normalized })}`,
      { schema: usernameAvailabilitySchema },
    );
  } catch {
    return { available: false, reason: "UNAVAILABLE" };
  }
}

/** Spec 12: kodi ivazi parol ba e-mail (javob hamesha yakxela) */
export const forgotPassword = (email: string) =>
  api<string>(`/Account/ForgotPassword?${new URLSearchParams({ Email: email })}`, { method: "DELETE" });

export const resetPassword = (q: { Email: string; Token: string; Password: string; ConfirmPassword: string }) =>
  api<string>(`/Account/ResetPassword?${new URLSearchParams(q)}`, { method: "DELETE" });
