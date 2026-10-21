import { expect, test } from "@playwright/test";
import { signedInContext } from "./helpers";

test("direct: du brauzer — paym va unsend dar realtime (Spec 08 AC1)", async ({ browser }) => {
  const a = await signedInContext(browser, "da");
  const b = await signedInContext(browser, "db");
  const pageA = await a.context.newPage();
  const pageB = await b.context.newPage();

  // A: New message → justuju → chat
  await pageA.goto("/direct/inbox");
  await pageA.getByRole("button", { name: "Send message" }).click();
  await pageA.getByPlaceholder("Search...").fill(b.me.userName);
  await pageA.getByRole("button", { name: new RegExp(b.me.userName) }).click();
  await pageA.getByRole("button", { name: "Chat", exact: true }).click();
  await expect(pageA).toHaveURL(/\/direct\/t\/\d+/);
  const chatUrl = new URL(pageA.url()).pathname;

  // B chat-ro kushoda intizor ast
  await pageB.goto(chatUrl);
  await expect(pageB.getByText("Say hi to start the conversation.")).toBeVisible();

  // A menavisad → B bidun reload mebinad
  const text = `Salom ${Date.now()}`;
  await pageA.getByPlaceholder("Message...").fill(text);
  await pageA.getByPlaceholder("Message...").press("Enter");
  const bubbleA = pageA.locator("li").getByText(text, { exact: true });
  const bubbleB = pageB.locator("li").getByText(text, { exact: true });
  await expect(bubbleA).toBeVisible();
  await expect(bubbleB).toBeVisible({ timeout: 3_000 });
  // Ruyxati chat-hoi B ham nav shud
  await expect(pageB.getByRole("link", { name: new RegExp(a.me.userName) })).toContainText(text);

  // Unsend → dar B ham nest meshavad
  await bubbleA.hover();
  await pageA.getByRole("button", { name: "Unsend" }).click();
  await expect(bubbleA).toHaveCount(0);
  await expect(bubbleB).toHaveCount(0, { timeout: 3_000 });

  await a.context.close();
  await b.context.close();
});

test("direct: API xomush → xatoi fahmo + Try again (Spec 10 AC6)", async ({ browser }) => {
  const { context } = await signedInContext(browser, "dx");
  const page = await context.newPage();
  await page.route("**/api/Chat/get-chats", (route) =>
    route.fulfill({ status: 502, json: { data: null, errors: ["Server dastras nest"], statusCode: 502 } }),
  );
  await page.goto("/direct/inbox");
  await expect(page.getByText("Couldn't load chats")).toBeVisible({ timeout: 15_000 });
  // Sahifa nashikast: sidebar va tugmai "Send message" boqi
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();

  await page.unroute("**/api/Chat/get-chats");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("No messages yet.")).toBeVisible();
  await context.close();
});

test("direct: internet qat' → paym rollback + toast (Spec 10 AC7)", async ({ browser }) => {
  const a = await signedInContext(browser, "oa");
  const b = await signedInContext(browser, "ob");
  const chat = await a.context.request.post(`/api/Chat/create-chat?receiverUserId=${b.me.userId}`);
  const chatId = (await chat.json()).data as number;

  const page = await a.context.newPage();
  await page.goto(`/direct/t/${chatId}`);
  await expect(page.getByText("Say hi to start the conversation.")).toBeVisible();

  await a.context.setOffline(true);
  await expect(page.getByText("No internet connection")).toBeVisible();
  await page.getByPlaceholder("Message...").fill("offline paym");
  await page.getByPlaceholder("Message...").press("Enter");
  await expect(page.getByText("Couldn't send message")).toBeVisible();
  await expect(page.getByText("offline paym")).toHaveCount(0);

  await a.context.setOffline(false);
  await expect(page.getByText("No internet connection")).toHaveCount(0);
  await a.context.close();
  await b.context.close();
});
