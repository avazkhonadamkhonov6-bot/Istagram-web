import "server-only";
import type { UserProfile } from "@repo/shared";
import { apiFetch, type Envelope, json, setToken, upstreamError } from "@/lib/bff";

/** Login dar NestJS → token ba cookie → ba brauzer faqat profil (bidun token) */
export async function loginAndRespond(userName: string, password: string, requestId?: string) {
  try {
    const res = await apiFetch("/Account/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userName, password }),
      requestId,
    });
    const body = (await res.json()) as Envelope<string>;
    if (!res.ok || !body.data) return json(body, res.status);

    await setToken(body.data);
    const me = await apiFetch("/UserProfile/get-my-profile", { token: body.data, requestId });
    return json((await me.json()) as Envelope<UserProfile>, me.status);
  } catch (err) {
    return upstreamError(err);
  }
}
