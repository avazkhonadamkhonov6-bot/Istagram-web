/** Har schema bo safeParse (Zod az @repo/shared) */
type Schema<T> = { safeParse(v: unknown): { success: true; data: T } | { success: false; error: { issues: unknown } } };

/** Fetch-i brauzer faqat ba /api/* (BFF). Token dar JS nest — cookie-i httpOnly-ro brauzer xud mefiristad. */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly errors: string[],
    readonly code?: string,
  ) {
    super(errors[0] ?? `HTTP ${status}`);
  }
}

type Envelope<T> = { data: T; errors: string[]; statusCode: number; code?: string };

export async function api<T>(path: string, init: RequestInit & { schema?: Schema<T> } = {}): Promise<T> {
  const { schema, ...rest } = init;
  const res = await fetch(`/api${path}`, { credentials: "same-origin", ...rest });
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/auth/")) {
    // Navigatsiyai purra: hamai keshi brauzer pok meshavad
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  }
  if (!res.ok || !body) {
    // Javobi gayr-JSON (sahifai 502-i Render hangomi restart / deploy) — matni fahmo ba joi "HTTP 502"
    const fallback =
      res.status >= 502 && res.status <= 504
        ? ["The server is restarting. Try again in a moment."]
        : [];
    throw new ApiError(res.status, body?.errors?.length ? body.errors : fallback, body?.code);
  }

  if (schema) {
    const parsed = schema.safeParse(body.data);
    if (!parsed.success) {
      // Javob bo kontrakt mos nest — dar dev xatoi baland (Spec 10 §7)
      if (process.env.NODE_ENV !== "production") console.error(`Kontrakt vayron: ${path}`, parsed.error.issues);
      throw new ApiError(500, ["Javobi server noto'g'ri ast"]);
    }
    return parsed.data;
  }
  return body.data;
}
