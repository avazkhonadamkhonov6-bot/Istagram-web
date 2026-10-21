import { expect, test } from "@playwright/test";
import { signedInContext } from "./helpers";

// Dar >= 1264px sidebar-i 245px qismi chap-i <main>-ro mepushonad (xatoi layout, baroi Abubakr — PROGRESS.md);
// to islohi on testho dar 1200px meravand (sidebar 72px).
test.use({ viewport: { width: 1200, height: 800 } });

/** FE-23 / FE-27: dil-i paym, tahrir, group chat va notes — dar du brauzer */
test("direct: dil-i paym va tahrir dar realtime (Spec 14 §4, Spec 15 §3)", async ({ browser }) => {
  const a = await signedInContext(browser, "la");
  const b = await signedInContext(browser, "lb");
  const chatId = (await (await a.context.request.post(`/api/Chat/create-chat?receiverUserId=${b.me.userId}`)).json()).data as number;

  const pageA = await a.context.newPage();
  const pageB = await b.context.newPage();
  await pageA.goto(`/direct/t/${chatId}`);
  await pageB.goto(`/direct/t/${chatId}`);
  await expect(pageB.getByText("Say hi to start the conversation.")).toBeVisible();

  const text = `Salom ${Date.now()}`;
  await pageA.getByPlaceholder("Message...").fill(text);
  await pageA.getByPlaceholder("Message...").press("Enter");
  const bubbleB = pageB.locator("li").getByText(text, { exact: true });
  await expect(bubbleB).toBeVisible({ timeout: 5_000 });

  // B double-tap → dil dar A ham namoyon
  await bubbleB.dblclick();
  await expect(pageA.getByRole("button", { name: "1 like", exact: true })).toBeVisible({ timeout: 5_000 });

  // A tahrir mekunad → B "Edited" va matni nav mebinad
  const bubbleA = pageA.locator("li").getByText(text, { exact: true });
  await bubbleA.hover();
  await pageA.getByRole("button", { name: "Edit" }).click();
  await pageA.getByPlaceholder("Message...").fill(`${text} (nav)`);
  await pageA.getByRole("button", { name: "Save" }).click();
  await expect(pageB.locator("li").getByText(`${text} (nav)`, { exact: true })).toBeVisible({ timeout: 5_000 });
  await expect(pageB.getByText("Edited")).toBeVisible();

  await a.context.close();
  await b.context.close();
});

test("direct: group chat az 'New message' (Spec 14 §4)", async ({ browser }) => {
  const a = await signedInContext(browser, "ga");
  const b = await signedInContext(browser, "gb");
  const c = await signedInContext(browser, "gc");
  const page = await a.context.newPage();
  await page.goto("/direct/inbox");
  await page.getByRole("button", { name: "Send message" }).click();
  for (const u of [b.me.userName, c.me.userName]) {
    await page.getByPlaceholder("Search...").fill(u);
    await page.getByRole("button", { name: new RegExp(u) }).last().click();
  }
  await page.getByPlaceholder("Group name (optional)").fill("E2E guruh");
  await page.getByRole("button", { name: "Chat", exact: true }).click();
  await expect(page).toHaveURL(/\/direct\/t\/\d+/);
  await expect(page.getByText("3 members")).toBeVisible();
  await expect(page.getByRole("button", { name: "Leave group" })).toBeVisible();
  for (const ctx of [a, b, c]) await ctx.context.close();
});

test("direct: note — muallif va dusti mutual mebinand (Spec 15 §5)", async ({ browser }) => {
  const a = await signedInContext(browser, "na");
  const b = await signedInContext(browser, "nb");
  for (const [x, y] of [
    [a, b],
    [b, a],
  ] as const) {
    await x.context.request.post(`/api/FollowingRelationShip/add-following-relation-ship?followingUserId=${y.me.userId}`);
  }
  const note = `Note ${Date.now() % 100000}`;
  const pageA = await a.context.newPage();
  await pageA.goto("/direct/inbox");
  await pageA.getByRole("button", { name: /Your note/ }).click();
  await pageA.getByPlaceholder("Share a thought...").fill(note);
  await pageA.getByRole("button", { name: "Share", exact: true }).click();
  await expect(pageA.getByRole("list", { name: "Notes" }).getByText(note)).toBeVisible();

  const pageB = await b.context.newPage();
  await pageB.goto("/direct/inbox");
  await expect(pageB.getByRole("list", { name: "Notes" }).getByText(note)).toBeVisible({ timeout: 10_000 });
  await a.context.close();
  await b.context.close();
});

test("accounts: private on/off va favorites (FE-24, FE-28)", async ({ browser }) => {
  const a = await signedInContext(browser, "pa");
  const b = await signedInContext(browser, "pb");
  const page = await a.context.newPage();
  await page.goto("/accounts/privacy");
  const toggle = page.getByRole("switch", { name: "Private account" });
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect.poll(async () => (await (await a.context.request.get("/api/UserProfile/get-my-profile")).json()).data.isPrivate).toBe(true);

  await page.goto("/accounts/favorites");
  await page.getByPlaceholder("Search").fill(b.me.userName);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("link", { name: new RegExp(b.me.userName) })).toBeVisible();
  await a.context.close();
  await b.context.close();
});
