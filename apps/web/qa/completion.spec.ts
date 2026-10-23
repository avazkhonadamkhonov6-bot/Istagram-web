import {
  test,
  expect,
  type Page,
  type APIRequestContext,
  type Cookie,
} from "@playwright/test";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
async function data(request: APIRequestContext, path: string) {
  const response = await request.get(`/api${path}`);
  expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
  return (await response.json()).data;
}
async function ownPost(request: APIRequestContext) {
  const response = await request.post("/api/Post/add-post", {
    multipart: {
      Content: "Completion post #completion",
      Images: { name: "qa.png", mimeType: "image/png", buffer: PNG },
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()).data;
}
async function menu(page: Page) {
  await page
    .getByRole("button", { name: "More options", exact: true })
    .filter({ visible: true })
    .click();
  return page.getByRole("dialog", { name: "Post options", exact: true });
}
let cookies: Cookie[];
test.beforeAll(async ({ request }) => {
  const response = await request.post("/api/auth/login", {
    data: { userName: "user1", password: "password123" },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  cookies = (await request.storageState()).cookies;
});
test.beforeEach(async ({ context }) => {
  await context.addCookies(cookies);
});
test.afterEach(async ({ page }, info) => {
  if (info.title.startsWith("private follow request"))
    await page.request.put("/api/UserProfile/update-privacy", {
      data: { isPrivate: false },
    });
  if (info.title.startsWith("profile name,")) {
    const result = await page.request.put(
      "/api/UserProfile/update-user-profile",
      { data: { userName: "user1", fullName: "User 1", website: null } },
    );
    expect(result.ok()).toBeTruthy();
  }
});

test("public signup availability works without cookies", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/signup`);
    await page.getByLabel("Username", { exact: true }).fill("user1");
    await expect(
      page.getByText("USERNAME_TAKEN: This username isn't available"),
    ).toBeVisible();
    await page
      .getByLabel("Username", { exact: true })
      .fill(`free_${Date.now()}`);
    await expect(
      page.getByLabel("Username available", { exact: true }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test("profile name, website and username save and update navigation", async ({
  page,
}) => {
  await page.goto("/accounts/edit");
  await page.getByLabel("Username", { exact: true }).fill("user2");
  await expect(
    page.getByText("This username isn't available.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit", exact: true }),
  ).toBeDisabled();
  const renamed = `user1_qa_${Date.now()}`;
  await page.getByLabel("Username", { exact: true }).fill(renamed);
  await page.getByLabel("Name", { exact: true }).fill("User 1 Updated");
  await page
    .getByLabel("Website", { exact: true })
    .fill("https://example.com/qa");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByText("Profile saved.", { exact: true })).toBeVisible();
  await page
    .getByRole("link", { name: "Profile", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(`/${renamed}`);
  await expect(
    page.getByText("User 1 Updated", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "https://example.com/qa" }),
  ).toHaveAttribute("href", "https://example.com/qa");
  await page.goto("/accounts/edit");
  await page.getByLabel("Username", { exact: true }).fill("user1");
  await page.getByLabel("Name", { exact: true }).fill("User 1");
  await page.getByLabel("Website", { exact: true }).fill("");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByText("Profile saved.", { exact: true })).toBeVisible();
});

test("post edit, hide likes, comment toggle, pin, archive and unarchive", async ({
  page,
}) => {
  const post = await ownPost(page.request);
  await page.goto(`/p/${post.postId}`);
  await (await menu(page))
    .getByRole("button", { name: "Edit post", exact: true })
    .click();
  await page.getByLabel("Edit caption").fill("Edited #completion @user2");
  await page.getByLabel("Edit location").fill("Dushanbe");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByText("Edited", { exact: false }).first(),
  ).toBeVisible();
  expect(
    (await data(page.request, `/Post/get-post-by-id?id=${post.postId}`))
      .location,
  ).toBe("Dushanbe");
  await (await menu(page))
    .getByRole("button", { name: "Hide like count", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await data(page.request, `/Post/get-post-by-id?id=${post.postId}`))
          .hideLikeCount,
    )
    .toBe(true);
  await (await menu(page))
    .getByRole("button", { name: "Turn off commenting", exact: true })
    .click();
  await expect(
    page.getByText("Comments are turned off.", { exact: true }),
  ).toBeVisible();
  await (await menu(page))
    .getByRole("button", { name: "Turn on commenting", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Add a comment", exact: true }),
  ).toBeVisible();
  await (await menu(page))
    .getByRole("button", { name: "Pin post", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await data(page.request, `/Post/get-post-by-id?id=${post.postId}`))
          .isPinned,
    )
    .toBe(true);
  await (await menu(page))
    .getByRole("button", { name: "Archive post", exact: true })
    .click();
  await expect
    .poll(async () =>
      (await data(page.request, "/Post/get-archived-posts")).some(
        (p: { postId: number }) => p.postId === post.postId,
      ),
    )
    .toBe(true);
  await page.reload();
  await (await menu(page))
    .getByRole("button", { name: "Unarchive post", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await data(page.request, `/Post/get-post-by-id?id=${post.postId}`))
          .isArchived,
    )
    .toBe(false);
  await page.request.delete(`/api/Post/delete-post?id=${post.postId}`);
});

test("collections create, add, rename, remove post and delete", async ({
  page,
}) => {
  const post = await ownPost(page.request);
  const title = `QA ${Date.now()}`;
  await page.goto(`/p/${post.postId}`);
  await (await menu(page))
    .getByRole("button", { name: "Add to collection", exact: true })
    .click();
  await page.getByLabel("Collection name").fill(title);
  await page
    .getByRole("button", { name: "New collection", exact: true })
    .click();
  await expect(
    page.getByText("Saved to collection", { exact: true }),
  ).toBeVisible();
  await page.goto("/user1/saved");
  await page.getByRole("button", { name: `${title} · 1`, exact: true }).click();
  const collections = page.getByRole("region", {
    name: "Collections",
    exact: true,
  });
  await expect(
    collections.getByRole("link", { name: "Post by user1" }),
  ).toBeVisible();
  await page.getByLabel("Collection name").fill(`${title} renamed`);
  await page
    .getByRole("button", { name: "Rename collection", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `${title} renamed · 1`, exact: true }),
  ).toBeVisible();
  await collections
    .getByRole("button", { name: "Remove from collection", exact: true })
    .click();
  await expect(
    page.getByText("This collection is empty.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete collection", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm delete collection", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `${title} renamed · 0`, exact: true }),
  ).toHaveCount(0);
  await page.request.delete(`/api/Post/delete-post?id=${post.postId}`);
});

test("highlights create, view, edit and delete including archived story", async ({
  page,
}) => {
  await page.request.post("/api/Story/AddStories", {
    multipart: {
      Image: { name: "story.png", mimeType: "image/png", buffer: PNG },
    },
  });
  await page.goto("/user1");
  await page
    .getByRole("button", { name: "New highlight", exact: true })
    .click();
  await page.getByLabel("Highlight title").fill("QA highlight");
  const archived = (await data(page.request, "/Story/get-story-archive")).find(
    (s: { expiresAt: string }) => Date.parse(s.expiresAt) < Date.now(),
  );
  expect(archived).toBeTruthy();
  await page
    .getByRole("checkbox", {
      name: `Include story ${archived.id}`,
      exact: true,
    })
    .check();
  await page
    .getByRole("button", { name: "Save highlight", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "QA highlight", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("img")).toBeVisible();
  await page
    .getByRole("button", { name: "Edit highlight", exact: true })
    .click();
  await page.getByLabel("Highlight title").fill("QA renamed");
  await page
    .getByRole("button", { name: "Save highlight", exact: true })
    .click();
  await page.getByRole("button", { name: "QA renamed", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete highlight", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm delete highlight", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "QA renamed", exact: true }),
  ).toHaveCount(0);
});

test("story viewers and sharing are connected to the API", async ({ page }) => {
  await page.request.post("/api/Story/AddStories?CloseFriends=true", {
    multipart: {
      Image: { name: "story.png", mimeType: "image/png", buffer: PNG },
    },
  });
  await page.goto("/stories/user1");
  await page.getByRole("button", { name: "Pause story", exact: true }).click();
  await page.getByRole("button", { name: /views · .*likes/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Story viewers", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("No views yet.", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL("/stories/user1");
  await page.getByRole("button", { name: "Share story", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Share", exact: true });
  await dialog.getByRole("textbox").fill("user2");
  await dialog
    .getByRole("button", { name: "Share with user2", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("Sent", { exact: true })).toBeVisible();
});

for (const width of [1440, 375])
  test(`create tags, TAGGED profile and layout at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page
      .getByRole("button", { name: "Create", exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByLabel("Choose media")
      .setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: PNG });
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByLabel("Write a caption").fill("Tagged completion");
    await page.getByLabel("Search people to tag").fill("user2");
    await page.getByRole("button", { name: "Tag user2", exact: true }).click();
    const published = page.waitForResponse(
      (r) =>
        r.url().includes("/Post/add-post") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Share", exact: true }).click();
    const newPost = (await (await published).json()).data;
    expect(
      newPost.tags.some(
        (tag: { userName: string }) => tag.userName === "user2",
      ),
    ).toBe(true);
    await expect(
      page.getByText("Your post has been shared.", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.goto("/user2/tagged");
    await expect(
      page.getByRole("tab", { name: "TAGGED", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.locator("main").getByRole("link", { name: "Post by user1" }).first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("profile relationship actions persist and report reaches the server", async ({
  page,
}) => {
  await page.goto("/user2");
  await page
    .getByRole("button", { name: "Profile options", exact: true })
    .click();
  await page.getByRole("button", { name: "Restrict", exact: true }).click();
  await page
    .getByRole("button", { name: "Profile options", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Unrestrict", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Unrestrict", exact: true }).click();
  await page
    .getByRole("button", { name: "Profile options", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add close friend", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Profile options", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove close friend", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Profile options", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Report account", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Scam, fraud or spam", exact: true })
    .click();
  await expect(
    page.getByText("Thanks for letting us know", { exact: true }),
  ).toBeVisible();
});

test("hydration and production CSP allow navigation after reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|hydrated|content security|refused to execute/i.test(
        message.text(),
      )
    )
      errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.locator("article").first()).toBeVisible();
  await page.reload();
  await page
    .getByRole("link", { name: "Profile", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL("/user1");
  await expect(
    page.getByRole("heading", { name: "user1", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

for (const width of [1440, 375])
  test(`live entries point to the active broadcast at ${width}px`, async ({
    page,
    browser,
    baseURL,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const peer = await browser.newContext({ baseURL });
    let id: number | undefined;
    try {
      await peer.request.post("/api/auth/login", {
        data: { userName: "user2", password: "password123" },
      });
      const response = await peer.request.post("/api/Live/start-live", {
        data: { title: "QA broadcast" },
      });
      expect(response.ok(), await response.text()).toBeTruthy();
      id = (await response.json()).data.liveId;
      await page.goto("/");
      await expect(
        page
          .getByRole("region", { name: "Stories" })
          .getByRole("link", { name: "user2 is live", exact: true }),
      ).toHaveAttribute("href", `/live/${id}`);
      await page
        .getByRole("button", { name: "Notifications", exact: true })
        .filter({ visible: true })
        .click();
      const panel = page.getByRole("complementary", {
        name: "Notifications",
        exact: true,
      });
      await expect(
        panel.locator(`a[href="/live/${id}"]`).first(),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await page.goto("/user2");
      await expect(
        page.getByRole("link", { name: "user2 is live", exact: true }),
      ).toHaveAttribute("href", `/live/${id}`);
      await page
        .getByRole("button", { name: "Create", exact: true })
        .filter({ visible: true })
        .click();
      await expect(
        page
          .getByRole("dialog")
          .getByRole("link", { name: "Live", exact: true }),
      ).toHaveAttribute("href", "/live/new");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    } finally {
      if (id) await peer.request.post(`/api/Live/end-live?liveId=${id}`);
      await peer.close();
    }
  });

test("owner likes and pins comments and sees mention/hashtag links", async ({
  page,
}) => {
  const post = await ownPost(page.request);
  await page.request.post("/api/Post/add-comment", {
    data: { postId: post.postId, comment: "Comment @user2 #completion" },
  });
  await page.goto(`/p/${post.postId}`);
  await page.getByRole("button", { name: "Like comment", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unlike comment", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pin", exact: true }).click();
  await expect(page.getByText("Pinned", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "@user2", exact: true }),
  ).toHaveAttribute("href", "/user2");
  await expect(
    page.getByRole("link", { name: "#completion", exact: true }).first(),
  ).toHaveAttribute("href", "/explore/tags/completion");
  await page.request.delete(`/api/Post/delete-post?id=${post.postId}`);
});

test("Favorites and follower removal work with real data", async ({
  page,
  browser,
  baseURL,
}) => {
  const peer = await browser.newContext({ baseURL });
  try {
    await peer.request.post("/api/auth/login", {
      data: { userName: "user2", password: "password123" },
      headers: { "x-forwarded-for": "10.99.22.2" },
    });
    const me = await data(page.request, "/UserProfile/get-my-profile");
    const other = await data(peer.request, "/UserProfile/get-my-profile");
    await page.request.put("/api/UserProfile/update-privacy", {
      data: { isPrivate: false },
    });
    await page.request.delete(
      `/api/User/remove-favorite?userId=${other.userId}`,
    );
    await peer.request.post(
      `/api/FollowingRelationShip/add-following-relation-ship?followingUserId=${me.userId}`,
    );
    await page.goto("/user1/followers");
    const row = page
      .getByRole("dialog", { name: "Followers", exact: true })
      .getByRole("listitem")
      .filter({ has: page.getByRole("link", { name: "user2", exact: true }) });
    await row.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(row).toHaveCount(0);
    const followers = await data(
      page.request,
      `/FollowingRelationShip/get-subscribers?UserId=${me.userId}`,
    );
    expect(followers.some((u: { id: string }) => u.id === other.userId)).toBe(
      false,
    );
    await peer.request.post(
      `/api/FollowingRelationShip/add-following-relation-ship?followingUserId=${me.userId}`,
    );
    await page.goto("/user2");
    await page
      .getByRole("button", { name: "Profile options", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Add favorite", exact: true })
      .click();
    await page.goto("/");
    await page.getByRole("tab", { name: "favorites", exact: true }).click();
    await expect(page.locator("article").first()).toBeVisible();
    const feed = await data(page.request, "/Post/get-favorites-feed");
    expect(feed.length).toBeGreaterThan(0);
    expect(
      feed.every((p: { userId: string }) => p.userId === other.userId),
    ).toBe(true);
    await page.goto("/user2");
    await page
      .getByRole("button", { name: "Profile options", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Remove favorite", exact: true })
      .click();
  } finally {
    await peer.close();
  }
});

test("private follow request can be confirmed from notifications", async ({
  page,
  browser,
  baseURL,
}) => {
  const peer = await browser.newContext({ baseURL });
  const me = await data(page.request, "/UserProfile/get-my-profile");
  let peerId: string | undefined;
  try {
    await peer.request.post("/api/auth/login", {
      data: { userName: "user2", password: "password123" },
      headers: { "x-forwarded-for": "10.99.22.3" },
    });
    peerId = (await data(peer.request, "/UserProfile/get-my-profile")).userId;
    await page.request.put("/api/UserProfile/update-privacy", {
      data: { isPrivate: true },
    });
    await page.request.delete(
      `/api/FollowingRelationShip/remove-follower?userId=${peerId}`,
    );
    const follow = await peer.request.post(
      `/api/FollowingRelationShip/add-following-relation-ship?followingUserId=${me.userId}`,
    );
    expect((await follow.json()).data.isRequested).toBe(true);
    await page.goto("/");
    await page
      .getByRole("button", { name: "Notifications", exact: true })
      .filter({ visible: true })
      .click();
    const panel = page.getByRole("complementary", {
      name: "Notifications",
      exact: true,
    });
    const row = panel.getByRole("listitem").filter({
      has: page.getByRole("button", { name: "Confirm", exact: true }),
    });
    await row.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect(
      panel.getByRole("button", { name: "Confirm", exact: true }),
    ).toHaveCount(0);
    await expect
      .poll(
        async () =>
          await data(
            peer.request,
            `/UserProfile/get-follow-status?userId=${me.userId}`,
          ),
      )
      .toBe("following");
  } finally {
    await page.request.put("/api/UserProfile/update-privacy", {
      data: { isPrivate: false },
    });
    if (peerId)
      await peer.request.post(
        `/api/FollowingRelationShip/add-following-relation-ship?followingUserId=${me.userId}`,
      );
    await peer.close();
  }
});
