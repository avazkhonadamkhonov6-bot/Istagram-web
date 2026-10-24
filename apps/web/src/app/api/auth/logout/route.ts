import { clearToken, forbiddenOrigin, forgetAccount, isSameOrigin, json, readToken } from "@/lib/bff";

/** POST /api/auth/logout — cookie pok meshavad, akkaunt az ruyxati Switch accounts ham */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return forbiddenOrigin();
  await forgetAccount(await readToken());
  await clearToken();
  return json({ data: true, errors: [], statusCode: 200 });
}
