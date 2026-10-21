import { NextRequest } from "next/server";
import { apiFetch, clearToken, clientIp, forbiddenOrigin, isSameOrigin, json, readToken, upstreamError } from "@/lib/bff";

/**
 * BFF-proxy: /api/<Controller>/<action> → API_URL/<Controller>/<action>
 * - Authorization az cookie-i httpOnly ilova meshavad
 * - /api/images/<fileName> → faylhoi API (bidun token)
 * - Login/register faqat tavassuti /api/auth/* (vagarna token ba JS merasid)
 */
const BLOCKED = new Set(["account/login", "account/register", "account/ws-ticket"]);
const PASS_REQUEST_HEADERS = ["content-type", "accept", "x-request-id", "range", "if-range"];
// fetch decompresses upstream bodies; the original Content-Length no longer matches.
const PASS_RESPONSE_HEADERS = ["content-type", "cache-control", "etag", "last-modified", "x-request-id", "accept-ranges", "content-range"];

async function handle(req: NextRequest, ctx: RouteContext<"/api/[...path]">) {
  const { path } = await ctx.params;
  const target = path.map(encodeURIComponent).join("/");
  if (BLOCKED.has(target.toLowerCase())) {
    return json({ data: null, errors: ["Yoft nashud"], statusCode: 404 });
  }
  const mutating = req.method !== "GET" && req.method !== "HEAD";
  if (mutating && !isSameOrigin(req)) return forbiddenOrigin();

  const headers = new Headers();
  for (const name of PASS_REQUEST_HEADERS) {
    const v = req.headers.get(name);
    if (v) headers.set(name, v);
  }
  const ip = clientIp(req);
  if (ip) headers.set("x-forwarded-for", ip);

  const isImage = path[0] === "images";
  const token = isImage ? undefined : await readToken();

  let res: Response;
  try {
    res = await apiFetch(`/${target}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      token,
      requestId: req.headers.get("x-request-id") ?? undefined,
      body: mutating ? req.body : undefined,
      // stream-i body (multipart) bidun buffer
      ...(mutating ? { duplex: "half" } : {}),
    } as RequestInit & { token?: string });
  } catch (err) {
    return upstreamError(err);
  }

  // Token-i kuhna → cookie pok, front ba /login meravad
  if (res.status === 401 && token) await clearToken();

  const out = new Headers();
  for (const name of PASS_RESPONSE_HEADERS) {
    const v = res.headers.get(name);
    if (v) out.set(name, v);
  }
  return new Response(res.body, { status: res.status, headers: out });
}

export const GET = handle;
export const HEAD = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
