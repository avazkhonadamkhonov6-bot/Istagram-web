import "server-only";
import type { UserProfile } from "@repo/shared";
import { apiFetch, type Envelope, json, rememberAccount, setToken, upstreamError } from "@/lib/bff";

/** Login dar NestJS → token ba cookie → ba brauzer faqat profil (bidun token) */
export async function loginAndRespond(userName: string, password: string, requestId?: string, ip?: string) {
  try {
    const res = await apiFetch("/Account/login", {
      method: "POST",
      headers: { "content-type": "application/json", ...(ip ? { "x-forwarded-for": ip } : {}) },
      body: JSON.stringify({ userName, password }),
      requestId,
    });
    const body = (await res.json()) as Envelope<string>;
    if (!res.ok || !body.data) return json(body, res.status);

    await setToken(body.data);
    const me = await apiFetch("/UserProfile/get-my-profile", { token: body.data, requestId });
    const profile = (await me.json()) as Envelope<UserProfile>;
    if (me.ok && profile.data) {
      const { userId, userName: name, image } = profile.data;
      await rememberAccount({ id: userId, userName: name, image, token: body.data });
    }
    return json(profile, me.status);
  } catch (err) {
    return upstreamError(err);
  }
}
