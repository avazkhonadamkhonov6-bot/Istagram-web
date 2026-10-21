import { apiFetch, clearToken, type Envelope, json, readToken, upstreamError } from "@/lib/bff";

/** GET /api/realtime/ticket — JWT-i 60 soniya baroi Socket.IO (ne tokeni asosi) */
export async function GET() {
  const token = await readToken();
  if (!token) return json({ data: null, errors: ["Avval vorid shaved"], statusCode: 401 });
  try {
    const res = await apiFetch("/Account/ws-ticket", { method: "POST", token });
    if (res.status === 401) await clearToken();
    return json((await res.json()) as Envelope<string>, res.status);
  } catch (err) {
    return upstreamError(err);
  }
}
