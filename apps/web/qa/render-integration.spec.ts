import { expect, test } from "@playwright/test";

// Mutations run against MSW only; the shared Render database is not modified.
test("favorites feed preserves likes across tabs", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("article").first()).toBeVisible();
  await page.getByRole("tab", { name: "favorites", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await page.locator("article").getByRole("button", { name: "Like", exact: true }).click();
  await expect(page.locator("article").getByRole("button", { name: "Unlike", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "following", exact: true }).click();
  await expect(page.locator("article").first().getByRole("button", { name: "Unlike", exact: true })).toBeVisible();
});

test("profile reels use the dedicated endpoint", async ({ page }) => {
  const response = page.waitForResponse(r => r.url().includes("/Post/get-user-reels?"));
  await page.goto("/abubakr/reels");
  expect((await response).status()).toBe(200);
  await expect(page.getByRole("tab", { name: "REELS", exact: true })).toHaveAttribute("aria-selected", "true");
});

test("owner can remove a follower", async ({ page }) => {
  await page.goto("/abubakr/followers");
  const row = page.getByRole("dialog", { name: "Followers", exact: true }).getByRole("listitem").filter({ has: page.getByRole("link", { name: "ali", exact: true }) });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(row).toHaveCount(0);
});

test("story replies accept spaces and reach Direct", async ({ page }) => {
  await page.goto("/stories/ali");
  await page.getByLabel("Reply to story").fill("A nice view with spaces");
  const response = page.waitForResponse(r => r.url().includes("/Story/reply-story"));
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect(page.getByText("Reply sent", { exact: true })).toBeVisible();
});

test("publishing sends location and Close Friends", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("article").first()).toBeVisible();
  const photo = await page.screenshot();
  const create = page.getByRole("button", { name: "Create", exact: true }).filter({ visible: true });
  await create.click();
  await page.getByLabel("Choose media").setInputFiles({ name: "test.png", mimeType: "image/png", buffer: photo });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Add location").fill("Dushanbe");
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByText("Your post has been shared.")).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator("article").first().getByRole("link", { name: "Dushanbe", exact: true })).toBeVisible();
  await create.click();
  await page.getByRole("button", { name: "story", exact: true }).click();
  await page.getByLabel("Choose media").setInputFiles({ name: "story.png", mimeType: "image/png", buffer: photo });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Close friends only").check();
  const response = page.waitForResponse(r => r.url().includes("/Story/AddStories?CloseFriends=true"));
  await page.getByRole("button", { name: "Share", exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect(page.getByText("Your story has been shared.")).toBeVisible();
});

test("private profile shows Requested and keeps posts locked", async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const response = await original(input, init);
      const url = String(input);
      if (!url.includes("/UserProfile/get-user-profile-by-id") && !url.includes("/FollowingRelationShip/add-following-relation-ship")) return response;
      const body = await response.json();
      if (url.includes("get-user-profile")) body.data.isPrivate = true;
      else body.data = { isFollowing: false, isRequested: true, subscribersCount: 100 };
      return new Response(JSON.stringify(body), { status: response.status, headers: { "content-type": "application/json" } });
    };
  });
  await page.goto("/ali");
  await expect(page.getByRole("heading", { name: "This account is private" })).toBeVisible();
  await page.getByRole("button", { name: "Follow", exact: true }).click();
  await expect(page.getByRole("button", { name: "Requested", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "This account is private" })).toBeVisible();
});

test("post owner can pin a comment and toggle its like", async ({ page }) => {
  await page.goto("/p/3");
  await page.getByRole("button", { name: "Pin", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Unpin", exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Like comment", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Unlike comment", exact: true }).first()).toBeVisible();
});
