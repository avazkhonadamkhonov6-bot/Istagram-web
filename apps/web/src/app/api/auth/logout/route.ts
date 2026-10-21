import { clearToken, forbiddenOrigin, isSameOrigin, json } from "@/lib/bff";

/** POST /api/auth/logout — cookie pok meshavad */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return forbiddenOrigin();
  await clearToken();
  return json({ data: true, errors: [], statusCode: 200 });
}
