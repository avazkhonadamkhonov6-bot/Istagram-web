import { expect, test } from "@playwright/test";
import { newContext, PASSWORD, register, uniqueName } from "./helpers";

test("register: cookie-i httpOnly, token dar JS nest, username-i takrori → 409", async ({ browser }) => {
  const context = await newContext(browser);
  const page = await context.newPage();
  const name = uniqueName("reg");

  const me = await register(context.request, name.toUpperCase().replace("REG", "Reg"));
  expect(me.userName).toBe(name.toLowerCase());

  // Spec 01 AC9: token faqat dar cookie-i httpOnly
  const cookie = (await context.cookies()).find((c) => c.name === "access_token");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");

  await page.goto("/direct/inbox");
  await expect(page.getByRole("heading", { name: me.userName })).toBeVisible();
  expect(await page.evaluate(() => document.cookie)).not.toContain("access_token");
  expect(await page.evaluate(() => Object.keys(localStorage).join(","))).not.toMatch(/token/i);

  // TZ §3: Ali = ali → 409
  const dup = await context.request.post("/api/auth/register", {
    data: { userName: name.toUpperCase(), fullName: "X", email: `x_${name}@e2e.tj`, password: PASSWORD, confirmPassword: PASSWORD },
  });
  expect(dup.status()).toBe(409);
  expect((await dup.json()).code).toBe("USERNAME_TAKEN");

  // Logout → cookie pok, sahifa → /login
  await context.request.post("/api/auth/logout");
  await page.goto("/direct/inbox");
  await expect(page).toHaveURL(/\/login/);
  await context.close();
});
