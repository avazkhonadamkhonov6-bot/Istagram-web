import "server-only";
import { cookies } from "next/headers";

/** Funksiyahoi server-i BFF (TZ §5.3): brauzer hech vaqt ba NestJS mustaqim murojiat namekunad. */

export const API_URL = process.env.API_URL ?? "http://localhost:4000";
export const ACCESS_COOKIE = "access_token";
const TIMEOUT_MS = 10_000;
const WEEK_SECONDS = 7 * 24 * 60 * 60;

export type Envelope<T> = { data: T | null; errors: string[]; statusCode: number; code?: string };

/** Fetch ba NestJS bo timeout 10 s va x-request-id */
export function apiFetch(path: string, init: RequestInit & { token?: string; requestId?: string } = {}) {
  const { token, requestId, headers, ...rest } = init;
  const h = new Headers(headers);
  if (token) h.set("authorization", `Bearer ${token}`);
  h.set("x-request-id", requestId ?? crypto.randomUUID());
  return fetch(`${API_URL}${path}`, {
    ...rest,
    headers: h,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

export async function readToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

/** Token faqat dar cookie-i httpOnly (Spec 01 AC9) */
export async function setToken(token: string) {
  (await cookies()).set(ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK_SECONDS,
  });
}

export async function clearToken() {
  (await cookies()).delete(ACCESS_COOKIE);
}

export function json<T>(body: Envelope<T>, status = body.statusCode) {
  return Response.json(body, { status });
}

/** Javobi yagona hangomi xatoi shabaka / timeout-i NestJS */
export function upstreamError(err: unknown) {
  const timeout = err instanceof DOMException && err.name === "TimeoutError";
  return json<null>({
    data: null,
    errors: [timeout ? "Server javob namedihad, baadtar kusish kuned" : "Server dastras nest"],
    statusCode: timeout ? 504 : 502,
  });
}

/** CSRF: baroi metodhoi tagyirdihanda header-i Origin boyad az hamin sayt boshad (TZ §5.3) */
export function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // darxosthoi server-ba-server / navigatsiyai oddi
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function forbiddenOrigin() {
  return json<null>({ data: null, errors: ["Origin ijozat doda nashud"], statusCode: 403 });
}
