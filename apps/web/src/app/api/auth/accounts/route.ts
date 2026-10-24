import type { UserProfile } from "@repo/shared";
import {
  apiFetch,
  type Envelope,
  forbiddenOrigin,
  isSameOrigin,
  json,
  readAccounts,
  readToken,
  rememberAccount,
  setToken,
  upstreamError,
  writeAccounts,
} from "@/lib/bff";

/** GET /api/auth/accounts — akkaunthoi saqlshuda baroi Switch accounts (bidun token) */
export async function GET() {
  const token = await readToken();
  let accounts = await readAccounts();
  // Session-i peshtar az in imkoniyat: akkaunti joriro ba ruyxat ilova mekunem
  if (token && !accounts.some((a) => a.token === token)) {
    try {
      const me = await apiFetch("/UserProfile/get-my-profile", { token });
      const profile = (await me.json()) as Envelope<UserProfile>;
      if (me.ok && profile.data) {
        const { userId: id, userName, image } = profile.data;
        accounts = [{ id, userName, image, token }, ...accounts.filter((a) => a.id !== id)];
        await writeAccounts(accounts);
      }
    } catch {
      // API javob namedihad — ruyxat-i mavjudro nishon medihem
    }
  }
  const list = accounts.map(({ id, userName, image, token: t }) => ({
    id,
    userName,
    image,
    current: t === token,
  }));
  return json({ data: list, errors: [], statusCode: 200 });
}

/** POST /api/auth/accounts — { id } → token-i on akkaunt cookie-i joriro ivaz mekunad → { data: UserProfile } */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return forbiddenOrigin();
  const body = (await req.json().catch(() => null)) as { id?: unknown } | null;
  if (typeof body?.id !== "string") return json({ data: null, errors: ["id lozim ast"], statusCode: 400 });

  const accounts = await readAccounts();
  const account = accounts.find((a) => a.id === body.id);
  if (!account) return json({ data: null, errors: ["Account not found"], statusCode: 404 });

  try {
    const me = await apiFetch("/UserProfile/get-my-profile", {
      token: account.token,
      requestId: req.headers.get("x-request-id") ?? undefined,
    });
    const profile = (await me.json()) as Envelope<UserProfile>;
    if (!me.ok || !profile.data) {
      // Token-i kuhna (muhlat guzasht / parol ivaz shud) — az ruyxat hazf, korbar boz vorid meshavad
      if (me.status === 401) await writeAccounts(accounts.filter((a) => a.id !== account.id));
      return json(profile, me.status);
    }
    await setToken(account.token);
    await rememberAccount({ ...account, userName: profile.data.userName, image: profile.data.image });
    return json(profile, 200);
  } catch (err) {
    return upstreamError(err);
  }
}
