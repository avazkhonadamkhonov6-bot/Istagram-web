import { expect, type APIRequestContext, type Browser, type BrowserContext } from "@playwright/test";

export const PASSWORD = "password123";

/** Username-i yakxela baroi har test */
export const uniqueName = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

/** IP-i alohida baroi har context — rate limit-i register (3/daq.) testhoro naband namekunad */
const randomIp = () => `10.${rnd()}.${rnd()}.${rnd()}`;
const rnd = () => Math.floor(Math.random() * 250) + 1;

export async function newContext(browser: Browser) {
  return browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": randomIp() } });
}

export type Me = { userId: string; userName: string };

/** Ruyxat tavassuti BFF → cookie-i httpOnly dar context */
export async function register(request: APIRequestContext, userName: string): Promise<Me> {
  const res = await request.post("/api/auth/register", {
    data: { userName, fullName: "E2E User", email: `${userName}@e2e.tj`, password: PASSWORD, confirmPassword: PASSWORD },
  });
  expect(res.status(), await res.text()).toBe(200);
  return (await res.json()).data as Me;
}

export async function login(request: APIRequestContext, userName: string, password = PASSWORD): Promise<Me> {
  const res = await request.post("/api/auth/login", { data: { userName, password } });
  expect(res.status()).toBe(200);
  return (await res.json()).data as Me;
}

/** Context bo useri nav, ki vorid shudaast */
export async function signedInContext(browser: Browser, prefix: string): Promise<{ context: BrowserContext; me: Me }> {
  const context = await newContext(browser);
  const me = await register(context.request, uniqueName(prefix));
  return { context, me };
}

// Aksi PNG-i 1x1
export const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
