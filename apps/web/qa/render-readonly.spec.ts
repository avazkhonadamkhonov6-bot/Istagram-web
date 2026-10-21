import { expect, test } from "@playwright/test";

test("production BFF reads the shared Render API and loads pages", async ({ page, context }) => {
  const apiFailures: string[] = [];
  const errors: string[] = [];
  page.on("requestfailed", request => {
    const failure = request.failure()?.errorText ?? "Request failed";
    if (new URL(request.url()).pathname.startsWith("/api/") && failure !== "net::ERR_ABORTED") apiFailures.push(failure);
  });
  page.on("pageerror", error => errors.push(`${page.url()}: ${error.message}`));
  // These assets must load before there is an authenticated session.
  for (const path of ["/brand/instagram-wordmark.svg", "/auth/mountains.jpg"]) {
    const response = await context.request.get(path);
    expect(response.status()).toBe(200);
  }
  await page.goto("/login");
  const username = process.env.QA_RENDER_USERNAME ?? "abubakr";
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill(process.env.QA_RENDER_PASSWORD ?? "password123");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  expect((await context.cookies()).some(c => c.name === "access_token" && c.httpOnly)).toBe(true);

  let hasFeedPosts = false;
  // Checks the decompressed body, catching stale upstream Content-Length headers.
  for (const path of ["/api/Post/get-following-post?PageSize=3", "/api/Story/get-stories", "/api/Chat/get-chats", "/api/Note/get-notes"]) {
    const response = await context.request.get(path);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    if (path.includes("get-following-post")) hasFeedPosts = body.data.length > 0;
  }
  await expect(page.getByRole("tab", { name: "following", exact: true })).toBeVisible();
  if (hasFeedPosts) await expect(page.locator("article").first()).toBeVisible();
  await expect(page.getByText("Could not load your feed.", { exact: true })).toHaveCount(0);
  const favorites = page.waitForResponse(r => r.url().includes("/Post/get-favorites-feed") && r.status() === 200);
  await page.getByRole("tab", { name: "favorites", exact: true }).click();
  expect(Array.isArray((await (await favorites).json()).data)).toBe(true);

  for (const path of [`/${username}/reels`, "/accounts/privacy", "/direct/inbox"]) {
    await page.goto(path);
    if (path.endsWith("/reels")) await expect(page.getByRole("tab", { name: "REELS", exact: true })).toBeVisible();
    if (path.endsWith("/privacy")) await expect(page.getByText("Private account", { exact: true })).toBeVisible();
    if (path.endsWith("/inbox")) await expect(page.getByRole("heading", { name: "Messages", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(apiFailures).toEqual([]);
  expect(errors).toEqual([]);
});
