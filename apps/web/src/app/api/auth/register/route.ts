import { apiFetch, type Envelope, forbiddenOrigin, isSameOrigin, json, upstreamError } from "@/lib/bff";
import { loginAndRespond } from "../session";

/** POST /api/auth/register — RegisterDto → ruyxat + login-i avtomati → cookie + { data: UserProfile } */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return forbiddenOrigin();
  const raw = await req.text();
  const requestId = req.headers.get("x-request-id") ?? undefined;
  try {
    const res = await apiFetch("/Account/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "",
      },
      body: raw,
      requestId,
    });
    if (!res.ok) return json((await res.json()) as Envelope<null>, res.status);
  } catch (err) {
    return upstreamError(err);
  }
  const { userName, password } = JSON.parse(raw) as { userName: string; password: string };
  return loginAndRespond(userName, password, requestId);
}
