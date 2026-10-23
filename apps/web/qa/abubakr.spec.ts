import { expect, test } from "@playwright/test";

test("desktop dock sends messages without leaving the feed", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.addInitScript(() => {
    const nativeFetch = window.fetch;
    const myId = "00000000-0000-4000-8000-000000000001";
    const message = {
      messageId: 1, chatId: 7, userId: "peer", userName: "dock.friend",
      userImage: null, messageText: "Hello from the dock", file: null,
      sharedPost: null, sendMassageDate: new Date().toISOString(),
    };
    const messages = [message];
    const chat = {
      chatId: 7, sendUserId: myId, sendUserName: "abubakr", sendUserImage: null,
      receiveUserId: "peer", receiveUserName: "dock.friend", receiveUserImage: null,
      lastMessage: message, unreadCount: 1, peerReadAt: null,
    };
    window.fetch = async (input, init) => {
      const path = String(input);
      const respond = (data: unknown) => Promise.resolve(new Response(JSON.stringify({ data, errors: [], statusCode: 200 }), { headers: { "content-type": "application/json" } }));
      if (path.includes("/Chat/get-chats")) return respond([chat]);
      if (path.includes("/Chat/get-chat-by-id")) return respond(messages);
      if (path.includes("/Chat/read-chat")) return respond({ chatId: 7, readAt: new Date().toISOString() });
      if (path.includes("/Chat/send-message")) {
        const form = init?.body as FormData;
        const sent = { ...message, messageId: 2, userId: myId, userName: "abubakr", messageText: String(form.get("MessageText")) };
        messages.push(sent);
        chat.lastMessage = sent;
        return respond(sent);
      }
      return nativeFetch(input, init);
    };
  });
  await page.goto("/");
  await page.locator("article").first().waitFor();
  const suggestions = await page.locator(".ig-suggestions").boundingBox();
  expect(suggestions?.width).toBe(360);
  expect(1920 - (suggestions!.x + suggestions!.width)).toBe(24);
  await page.evaluate(() => window.scrollTo(0, 250));
  const scrollY = await page.evaluate(() => window.scrollY);
  await page.getByRole("button", { name: "Open messages preview" }).click();
  const dock = page.getByRole("region", { name: "Messages preview" });
  await dock.getByRole("button", { name: /dock.friend/ }).click();
  await expect(dock.getByText("Hello from the dock", { exact: true })).toBeVisible();
  await expect(dock.getByRole("button", { name: "Send photo or video" })).toBeVisible();
  await dock.getByRole("textbox", { name: "Message", exact: true }).fill("Reply without leaving the feed");
  await dock.getByRole("button", { name: "Send", exact: true }).click();
  await expect(dock.getByText("Reply without leaving the feed", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
  const bounds = await dock.boundingBox();
  expect(bounds?.width).toBe(360);
  expect(bounds?.height).toBe(520);
  await dock.getByRole("button", { name: "Back to messages" }).click();
  await expect(dock.getByRole("button", { name: /dock.friend/ })).toBeVisible();
  await dock.getByRole("button", { name: "Close messages" }).click();
  await expect(dock).toBeHidden();
  await page.getByRole("button", { name: "Open messages preview" }).click();
  await dock.getByRole("button", { name: /dock.friend/ }).click();
  await expect(dock.getByText("Reply without leaving the feed", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("desktop-dock.png") });
  await dock.getByRole("link", { name: "Expand conversation" }).click();
  await expect(page).toHaveURL(/\/direct\/t\/7$/);
  await expect(page.getByRole("textbox", { name: "Message", exact: true })).toBeVisible();
  await expect(page.getByText("Reply without leaving the feed", { exact: true }).last()).toBeVisible();
});

for (const width of [1440, 1000, 390]) {
  test(`navigation and feed at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Stories" })).toBeVisible();
    await expect(page.locator("article").first()).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    const nav = page
      .getByRole("navigation", { name: "Primary" })
      .filter({ visible: true });
    await expect(nav).toHaveCount(1);
    await page.mouse.move(width - 20, 20);
    if (width >= 768) await expect.poll(async () => (await nav.boundingBox())?.width).toBe(72);
    const bounds = await nav.boundingBox();
    if (width >= 768) expect(bounds?.width).toBe(72);
    else expect(bounds?.height).toBe(50);
  });
}

test("sidebar expands on hover without shifting the page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" }).filter({ visible: true });
  await page.locator("article").first().waitFor();
  await page.mouse.move(600, 20);
  await expect.poll(async () => (await nav.boundingBox())?.width).toBe(72);
  const left = await page.locator("main").evaluate(el => el.getBoundingClientRect().left);
  await nav.hover();
  await expect.poll(async () => (await nav.boundingBox())?.width).toBe(245);
  await expect(nav.getByText("Home", { exact: true })).toBeVisible();
  expect(await page.locator("main").evaluate(el => el.getBoundingClientRect().left)).toBe(left);
  await page.mouse.move(600, 20);
  await expect.poll(async () => (await nav.boundingBox())?.width).toBe(72);
  await expect(nav.getByText("Home", { exact: true })).toBeHidden();
});

test("notifications load and mark read", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .filter({ visible: true })
    .click();
  const panel = page.getByRole("complementary", { name: "Notifications" });
  await expect(panel.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(
    panel.getByText("liked your post.", { exact: false }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const r = await fetch("/api/Notification/get-unread-count");
        return (await r.json()).data.count;
      }),
    )
    .toBe(0);
  await page.keyboard.press("Escape");
  await expect(panel).not.toBeVisible();
});

test("create validates files and shares a cropped photo", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Create", exact: true })
    .filter({ visible: true })
    .click();
  await page.getByLabel("Choose media").setInputFiles({
    name: "invalid.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("invalid"),
  });
  await expect(page.getByRole("alert")).toContainText("Use JPEG");
  const image = await page.screenshot();
  await page
    .getByLabel("Choose media")
    .setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: image });
  await page.getByRole("button", { name: "Square", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Write a caption").fill("QA photo #pamir");
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByText("Your post has been shared.")).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator("article").first()).toContainText("QA photo");
});

test("profile tabs and following routes", async ({ page }) => {
  await page.goto("/abubakr");
  await expect(
    page.getByRole("heading", { name: "abubakr", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "SAVED", exact: true }).click();
  await expect(page).toHaveURL(/\/abubakr\/saved$/);
  await expect(
    page.getByRole("tab", { name: "SAVED", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.goto("/abubakr/following");
  await expect(
    page.getByRole("dialog", { name: "Following", exact: true }),
  ).toBeVisible();
});

test("story pause, view and keyboard exit", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("region", { name: "Stories" })
    .getByRole("link")
    .filter({ hasText: "ali" })
    .click();
  await page.getByRole("button", { name: "Pause story", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Play story", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const r = await fetch("/api/Story/get-stories");
        const b = await r.json();
        return b.data.find((u: { userName: string }) => u.userName === "ali")
          .hasUnseen;
      }),
    )
    .toBe(false);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL("/");
});

test("appearance persists after reload", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("article").first()).toBeVisible();

  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "More", exact: true }).focus();
  await page.keyboard.press("Enter");

  await page.getByRole("menuitem", { name: "Switch appearance" }).click();

  await expect(page.locator("html")).toHaveClass(/light/);

  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveClass(/light/);
});

test("post opens in modal and supports replies", async ({ page }) => {
  await page.goto("/");
  await page
    .locator("article")
    .first()
    .getByRole("link", { name: "Comment", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Reply", exact: true })
    .first()
    .click();
  await page
    .getByRole("textbox", { name: "Add a comment", exact: true })
    .fill("A reply from QA");
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Add a comment", exact: true }),
  ).toHaveValue("");
});

test("share loads recipients and sends the post", async ({ page }) => {
  await page.goto("/");
  await page
    .locator("article")
    .first()
    .getByRole("button", { name: "Share", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("textbox", { name: "Search people" }).fill("ali");
  const ali = page.getByRole("dialog").getByRole("button", { name: "Share with ali" });
  await expect(ali).toBeVisible();
  await ali.click();
  await expect(ali).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Send", exact: true })
    .click();
  await expect(page.getByText("Sent", { exact: true })).toBeVisible();
});

test("reels empty state", async ({ page }) => {
  await page.goto("/reels");
  await expect(
    page.getByRole("heading", { name: "No reels yet" }),
  ).toBeVisible();
});

for (const width of [1440, 1000, 390]) {
  test(`profile, settings, explore and post fit ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/abubakr", "/accounts/edit", "/explore", "/p/1"]) {
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
      if (path === "/abubakr")
        await expect(
          page.getByRole("heading", { name: "abubakr", exact: true }),
        ).toBeVisible();
      if (path === "/accounts/edit")
        await expect(
          page.getByRole("heading", { name: "Edit profile", exact: true }),
        ).toBeVisible();
      if (path === "/explore" || path === "/p/1")
        await expect(page.locator("main img").first()).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    }
    if (width === 390)
      await page.screenshot({
        path: "/tmp/instagram-post-mobile.png",
        fullPage: true,
      });
  });
}

test("like failure rolls back and shows feedback", async ({ page }) => {
  await page.goto("/");
  const card = page.locator("article").first();
  const like = card.getByRole("button", { name: "Like", exact: true });
  await expect(like).toBeVisible();
  await page.evaluate(() => {
    const original = window.fetch.bind(window);
    window.fetch = (input, init) =>
      String(input).includes("/Post/like-post")
        ? Promise.reject(new TypeError("Failed to fetch"))
        : original(input, init);
  });
  await like.click();
  await expect(
    card.getByRole("button", { name: "Like", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Could not update the post. Try again."),
  ).toBeVisible();
});

test("feed keeps a small number of cards mounted for 200 posts", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      if (!String(input).includes("/Post/get-following-post"))
        return original(input, init);
      const response = await original(input, init);
      const body = await response.json();
      const url = new URL(String(input), location.origin);
      const page = Number(url.searchParams.get("PageNumber") ?? 1);
      const size = Number(url.searchParams.get("PageSize") ?? 10);
      const posts = Array.from({ length: 200 }, (_, i) => ({
        ...body.data[i % body.data.length],
        postId: 10000 + i,
      }));
      return new Response(
        JSON.stringify({
          ...body,
          data: posts.slice((page - 1) * size, page * size),
          totalPage: Math.ceil(200 / size),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };
  });
  await page.goto("/");
  await expect(page.locator("article").first()).toBeVisible();
  for (
    let i = 0;
    i < 40 && (await page.locator("[data-feed-post]").count()) < 200;
    i++
  ) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(120);
  }
  await expect(page.locator("[data-feed-post]")).toHaveCount(200);
  await expect
    .poll(() => page.locator("article").count())
    .toBeLessThanOrEqual(15);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator("article").first()).toBeVisible();
});

test("reel upload, autoplay, mute, like and save", async ({ page }) => {
  await page.goto("/");
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 180;
    canvas.height = 320;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "teal";
    context.fillRect(0, 0, 180, 320);
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => chunks.push(event.data);
    const done = new Promise<string>((resolve) => {
      recorder.onstop = async () => {
        const buffer = await new Blob(chunks, {
          type: "video/webm",
        }).arrayBuffer();
        resolve(btoa(String.fromCharCode(...new Uint8Array(buffer))));
        stream.getTracks().forEach((t) => t.stop());
      };
    });
    recorder.start();
    setTimeout(() => recorder.stop(), 400);
    return done;
  });
  await page
    .getByRole("button", { name: "Create", exact: true })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: "reel", exact: true }).click();
  await page.getByLabel("Choose media").setInputFiles({
    name: "reel.webm",
    mimeType: "video/webm",
    buffer: Buffer.from(bytes, "base64"),
  });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByText("Your reel has been shared.")).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByRole("link", { name: "Reels", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.locator("video").filter({ visible: true })).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator("video")
        .filter({ visible: true })
        .evaluate((video: HTMLVideoElement) => video.paused),
    )
    .toBe(false);
  // Reels bo ovoz sar meshavand (misli Instagram); Mute / Unmute baroi hamai reel-ho
  await page.getByRole("button", { name: "Mute", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unmute", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Unmute", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mute", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator("video")
      .filter({ visible: true })
      .evaluate((video: HTMLVideoElement) => video.muted),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Like", exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    page
      .getByRole("button", { name: "Unlike", exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save", exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    page
      .getByRole("button", { name: "Unsave", exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
});

test("signup checks username with debounce and keeps invalid form disabled", async ({
  page,
}) => {
  await page.goto("/signup");
  await expect(
    page.getByRole("button", { name: "Sign up", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Username", { exact: true }).fill("ali");
  await expect(
    page.getByText("USERNAME_TAKEN: This username isn't available"),
  ).toBeVisible();
  await page.getByLabel("Username", { exact: true }).fill("qa.frontend");
  await expect(
    page.getByLabel("Username available", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign up", exact: true }),
  ).toBeDisabled();
});
