import { clientIp, forbiddenOrigin, isSameOrigin, json } from "@/lib/bff";
import { loginAndRespond } from "../session";

/** POST /api/auth/login — { userName, password } → cookie-i httpOnly + { data: UserProfile } */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return forbiddenOrigin();
  const body = (await req.json().catch(() => null)) as { userName?: unknown; password?: unknown } | null;
  if (typeof body?.userName !== "string" || typeof body.password !== "string") {
    return json({ data: null, errors: ["userName va password lozim ast"], statusCode: 400 });
  }
  return loginAndRespond(body.userName, body.password, req.headers.get("x-request-id") ?? undefined, clientIp(req));
}
