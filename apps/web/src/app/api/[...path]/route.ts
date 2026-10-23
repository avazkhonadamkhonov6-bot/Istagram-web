import { NextRequest } from "next/server";
import { UPLOAD_TIMEOUT_MS, apiFetch, clearToken, clientIp, forbiddenOrigin, isSameOrigin, json, readToken, upstreamError } from "@/lib/bff";

/**
 * BFF-proxy: /api/<Controller>/<action> → API_URL/<Controller>/<action>
 * - Authorization az cookie-i httpOnly ilova meshavad
 * - /api/images/<fileName> → faylhoi API (bidun token)
 * - Login/register faqat tavassuti /api/auth/* (vagarna token ba JS merasid)
 */
const RETRY_STATUS = new Set([502, 503, 504]);
const BLOCKED = new Set(["account/login", "account/register", "account/ws-ticket"]);
// range / content-range: audio va video-ro Safari faqat bo darxosthoi qismi (206) bozi mekunad
const PASS_REQUEST_HEADERS = ["content-type", "accept", "x-request-id", "range", "if-range"];
const PASS_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "cache-control",
  "etag",
  "last-modified",
  "x-request-id",
  "accept-ranges",
  "content-range",
];

async function handle(req: NextRequest, ctx: RouteContext<"/api/[...path]">) {
  const { path } = await ctx.params;
  // '.' / '..' dar roh URL-ro dar API tagyir medihand (masalan, ba account/login) — man' ast
  if (path.some((p) => p === "." || p === ".." || p.includes("/") || p.includes("\\"))) {
    return json({ data: null, errors: ["Yoft nashud"], statusCode: 404 });
  }
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

  const send = () =>
    apiFetch(`/${target}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      token,
      ...(req.headers.get("content-type")?.startsWith("multipart/") ? { timeoutMs: UPLOAD_TIMEOUT_MS } : {}),
      requestId: req.headers.get("x-request-id") ?? undefined,
      body: mutating ? req.body : undefined,
      // stream-i body (multipart) bidun buffer
      ...(mutating ? { duplex: "half" } : {}),
    } as RequestInit & { token?: string; timeoutMs?: number });

  let res: Response;
  try {
    res = await send();
    // Render (free) hangomi bedorshavi / deploy 502-503 medihad yo pevastagiro mebandad —
    // GET bexatar ast, 2 bori digar bo intizor (1 s, 3 s) takror meshavad. POST/PUT takror nameshavand.
    for (const wait of mutating ? [] : [1000, 3000]) {
      if (!RETRY_STATUS.has(res.status)) break;
      await new Promise((r) => setTimeout(r, wait));
      res = await send();
    }
  } catch (err) {
    if (mutating || (err instanceof DOMException && err.name === "TimeoutError")) return upstreamError(err);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      res = await send();
    } catch (retryErr) {
      return upstreamError(retryErr);
    }
  }

  // Token-i kuhna → cookie pok, front ba /login meravad
  if (res.status === 401 && token) await clearToken();

  const out = new Headers();
  // Node fetch decompresses br/gzip/deflate bodies but keeps upstream headers.
  // Their Content-Length describes the compressed bytes, so forwarding it
  // truncates JSON in the browser. Keep it for uncompressed media/ranges.
  const encoding = res.headers.get("content-encoding")?.toLowerCase();
  const decoded = Boolean(encoding && encoding !== "identity");
  for (const name of PASS_RESPONSE_HEADERS) {
    if (name === "content-length" && decoded) continue;
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
