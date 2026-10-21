import { NextResponse, type NextRequest } from "next/server";

/**
 * Next 16 proxy (sobiq middleware):
 * 1. CSP-i qat'i bo nonce (TZ §6.1, Spec 10 §7.1)
 * 2. Bidun cookie-i `access_token` → /login; bo cookie dar /login, /signup → /
 *    (Dar rejimi mock — NEXT_PUBLIC_API_MOCKING=on — tekshirishi cookie xomush.)
 */
const AUTH_PAGES = ["/login", "/signup"];
const PUBLIC_PREFIXES = ["/dev"];

function buildCsp(nonce: string) {
  const isDev = process.env.NODE_ENV === "development";
  const ws = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";
  const wsOrigin = ws.replace(/^http/, "ws");
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // atributhoi style (andozai avatar va g.) — React onhoro dar HTML menavisad
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "media-src 'self' blob:",
    "font-src 'self'",
    `connect-src 'self' ${ws} ${wsOrigin}`,
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const mocking = process.env.NEXT_PUBLIC_API_MOCKING === "on";
  const hasSession = req.cookies.has("access_token");
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p);
  const isPublic = isAuthPage || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!mocking && !hasSession && !isPublic) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (!mocking && hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);
  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);

  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|mockServiceWorker.js).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
