import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill("user1");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator("article").first()).toBeVisible();
});

test("live feed like, save, comment and share", async ({ page }) => {
  const card = page.locator("article").first();
  const like = card.getByRole("button", { name: "Like", exact: true });
  if (await like.count()) await like.click();
  await expect(
    card.getByRole("button", { name: "Unlike", exact: true }),
  ).toBeVisible();
  const save = card.getByRole("button", { name: "Save", exact: true });
  if (await save.count()) await save.click();
  await expect(
    card.getByRole("button", { name: "Unsave", exact: true }),
  ).toBeVisible();
  await card
    .getByRole("textbox", { name: "Add a comment", exact: true })
    .fill("Live QA comment");
  await card.getByRole("button", { name: "Post", exact: true }).click();
  await expect(
    card.getByRole("textbox", { name: "Add a comment", exact: true }),
  ).toHaveValue("");
  await card.getByRole("button", { name: "Share", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Search people").fill("user2");
  await dialog.getByRole("button", { name: "Share with user2" }).click();
  await dialog.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("Sent", { exact: true })).toBeVisible();
});

test("live create, hashtag, post detail and saved profile", async ({
  page,
}) => {
  const image = await page.screenshot();
  await page
    .getByRole("button", { name: "Create", exact: true })
    .filter({ visible: true })
    .click();
  await page.getByLabel("Choose media").setInputFiles({
    name: "qa-live.png",
    mimeType: "image/png",
    buffer: image,
  });
  await page.getByRole("button", { name: "Portrait", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .getByLabel("Write a caption")
    .fill("Live integration photo #abubakrqa");
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByText("Your post has been shared.")).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator("article").first()).toContainText(
    "Live integration photo",
  );
  await page
    .locator("article")
    .first()
    .getByRole("link", { name: "Comment", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Add a comment", exact: true })
    .fill("Live detail comment");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Post", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText("Live detail comment"),
  ).toBeVisible();
  await page.goto("/explore/tags/abubakrqa");
  await expect(
    page
      .locator("main")
      .getByRole("link")
      .filter({ has: page.locator("img") }),
  ).not.toHaveCount(0);
  await page.goto("/user1/saved");
  await expect(
    page.getByRole("tab", { name: "SAVED", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});

test("live profile edit, avatar and following", async ({ page }) => {
  const bio = `Abubakr live QA ${Date.now()}`;
  await page.goto("/accounts/edit");
  await page.getByLabel("Bio", { exact: true }).fill(bio);
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();
  await page.getByLabel("Profile photo").setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: await page.screenshot(),
  });
  await expect(page.getByText("Photo updated.")).toBeVisible();
  await page.goto("/user1");
  await expect(page.getByText(bio, { exact: true })).toBeVisible();
  await page.goto("/user10");
  await page.getByRole("button", { name: "Follow", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Following", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Following", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Follow", exact: true }),
  ).toBeVisible();
});

test("live story upload and own view count", async ({ page }) => {
  const image = await page.screenshot();
  await page
    .getByRole("button", { name: "Create", exact: true })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: "story", exact: true }).click();
  await page.getByLabel("Choose media").setInputFiles({
    name: "qa-story.png",
    mimeType: "image/png",
    buffer: image,
  });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByText("Your story has been shared.")).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByRole("region", { name: "Stories" })
    .getByRole("link", { name: "user1", exact: true })
    .click();
  await page.getByRole("button", { name: "Pause story", exact: true }).click();
  await expect(page.getByText(/views ·/)).toBeVisible();
});

test("live password change and restore", async ({ page }) => {
  await page.goto("/accounts/password");
  for (const [oldPassword, newPassword] of [
    ["password123", "Abubakr-QA-123!"],
    ["Abubakr-QA-123!", "password123"],
  ]) {
    await page.getByLabel("Old password", { exact: true }).fill(oldPassword);
    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill(newPassword);
    await page
      .getByRole("button", { name: "Change password", exact: true })
      .click();
    await expect(page.getByLabel("Old password", { exact: true })).toHaveValue(
      "",
    );
    await expect(
      page.getByText("Password changed.", { exact: true }),
    ).toBeVisible();
  }
});
