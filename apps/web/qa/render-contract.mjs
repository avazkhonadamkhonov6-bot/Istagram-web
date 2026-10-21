import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const schemas = require("../../../packages/shared/dist/index.js");
const base = (process.env.QA_RENDER_API_URL ?? "https://istagram-web.onrender.com").replace(/\/$/, "");
// Seeded demo credentials; real credentials can be passed through environment variables.
const credentials = {
  userName: process.env.QA_RENDER_USERNAME ?? "abubakr",
  password: process.env.QA_RENDER_PASSWORD ?? "password123",
};
async function request(path, init = {}) {
  const response = await fetch(base + path, { ...init, signal: AbortSignal.timeout(70_000) });
  assert(response.ok, `${path}: HTTP ${response.status}`);
  return response;
}
const swagger = await (await request("/swagger-json")).json();
console.log(`Swagger: ${Object.keys(swagger.paths).length} paths`);
const login = await (await request("/Account/login", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(credentials),
})).json();
assert.equal(typeof login.data, "string", "Login must return a token");
const headers = { authorization: `Bearer ${login.data}` };
async function check(path, schema) {
  const envelope = await (await request(path, { headers })).json();
  const parsed = schema.safeParse(envelope.data);
  assert(parsed.success, `${path}: response does not match shared schema`);
  console.log(`PASS ${path.split("?")[0]}`);
  return parsed.data;
}
const me = await check("/UserProfile/get-my-profile", schemas.userProfileSchema);
const posts = await check("/Post/get-following-post?PageSize=3", schemas.postDtoSchema.array());
const checks = [
  ["/Post/get-reels?PageSize=3", schemas.postDtoSchema.array()],
  [`/Post/get-user-reels?UserId=${me.userId}&PageSize=3`, schemas.postDtoSchema.array()],
  ["/Post/get-favorites-feed?PageSize=3", schemas.postDtoSchema.array()],
  ["/User/get-users?PageSize=3", schemas.userListItemSchema.array()],
  ["/Story/get-stories", schemas.userStoriesSchema.array()],
  ["/Chat/get-chats", schemas.chatDtoSchema.array()],
  ["/Note/get-notes", schemas.noteDtoSchema.array()],
  ["/User/get-favorites", schemas.userShortSchema.array()],
  ["/FollowingRelationShip/get-follow-requests", schemas.userShortSchema.array()],
  ["/Collection/get-collections", schemas.collectionDtoSchema.array()],
];
for (let i = 0; i < checks.length; i += 2) await Promise.all(checks.slice(i, i + 2).map(([path, schema]) => check(path, schema)));
const file = posts.flatMap(p => p.images)[0];
if (file) {
  const response = await request(`/images/${encodeURIComponent(file)}`);
  assert.match(response.headers.get("content-type") ?? "", /^(image|video)\//);
  await response.body.cancel();
  console.log("PASS media");
}
console.log("Read-only Render contract checks passed; no posts, follows or messages were changed.");
