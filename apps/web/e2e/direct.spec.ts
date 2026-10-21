import { expect, test } from "@playwright/test";
import { PNG, signedInContext } from "./helpers";

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

test("direct: unread, Seen, typing va toast-i notification (Spec 13)", async ({ browser }) => {
  const a = await signedInContext(browser, "sa");
  const b = await signedInContext(browser, "sb");
  const chatId = (await (await a.context.request.post(`/api/Chat/create-chat?receiverUserId=${b.me.userId}`)).json()).data as number;

  const pageB = await b.context.newPage();
  await pageB.goto("/direct/inbox");
  await expect(pageB.getByText("No messages yet.")).toHaveCount(0);

  // A paym mefiristad → B nuqtai "Unread" mebinad
  await a.context.request.put("/api/Chat/send-message", { multipart: { ChatId: String(chatId), MessageText: "Naxonda" } });
  // Nuqta dar ruyxati chat-ho (dar sidebar ham badge-i "Unread" hast)
  await expect(pageB.getByRole("link", { name: new RegExp(a.me.userName) }).getByLabel("Unread")).toBeVisible();

  // A chat-ro mekushoyad; B chat-ro mekushoyad → A "Seen" mebinad
  const pageA = await a.context.newPage();
  await pageA.goto(`/direct/t/${chatId}`);
  await expect(pageA.locator("li").getByText("Naxonda", { exact: true })).toBeVisible();
  await expect(pageA.getByText("Seen", { exact: true })).toHaveCount(0);
  await pageB.goto(`/direct/t/${chatId}`);
  await expect(pageA.getByText("Seen", { exact: true })).toBeVisible({ timeout: 5_000 });
  await expect(pageB.getByLabel("Unread")).toHaveCount(0);

  // Typing: A menavisad → B "... is typing..." mebinad
  await pageA.getByPlaceholder("Message...").fill("navishta");
  await expect(pageB.getByText(`${a.me.userName} is typing...`)).toBeVisible({ timeout: 5_000 });

  // Notification: A posti B-ro like mekunad → B toast megirad
  const created = await b.context.request.post("/api/Post/add-post", {
    multipart: { Images: { name: "n.png", mimeType: "image/png", buffer: PNG } },
  });
  const postId = (await created.json()).data.postId as number;
  await a.context.request.post(`/api/Post/like-post?postId=${postId}`);
  await expect(pageB.getByText("liked your post.")).toBeVisible({ timeout: 5_000 });

  await a.context.close();
  await b.context.close();
});
