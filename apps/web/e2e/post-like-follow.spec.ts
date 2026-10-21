import { expect, test } from "@playwright/test";
import { PNG, signedInContext } from "./helpers";

/**
 * Senariyahoi post, like, follow — tavassuti BFF dar brauzer (cookie-i voqe'i).
 * UI-i in sahifaho (FE-07, FE-09, FE-18) az Abubakr ast; pas az tayyor shudan ba UI guzaronida meshavand.
 */

test("post: upload-i multipart → post bo aks, aks az /api/images kushoda meshavad", async ({ browser }) => {
  const { context, me } = await signedInContext(browser, "post");
  const res = await context.request.post("/api/Post/add-post", {
    multipart: {
      Title: "Pomir",
      Content: "Kuhho #e2e",
      Images: { name: "a.png", mimeType: "image/png", buffer: PNG },
    },
  });
  expect(res.status()).toBe(200);
  const post = (await res.json()).data;
  expect(post).toMatchObject({ userId: me.userId, title: "Pomir", isReel: false });
  expect(post.images).toHaveLength(1);

  const img = await context.request.get(`/api/images/${post.images[0]}`);
  expect(img.status()).toBe(200);
  // Spec 03: aks ba WebP tabdil doda meshavad
  expect(img.headers()["content-type"]).toBe("image/webp");

  const mine = await (await context.request.get("/api/Post/get-my-posts")).json();
  expect(mine.data.map((p: { postId: number }) => p.postId)).toContain(post.postId);

  // Fayli gayriaks → 400
  const bad = await context.request.post("/api/Post/add-post", {
    multipart: { Images: { name: "a.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF") } },
  });
  expect(bad.status()).toBe(400);
  await context.close();
});

test("like: toggle va shumora durust", async ({ browser }) => {
  const author = await signedInContext(browser, "author");
  const fan = await signedInContext(browser, "fan");
  const created = await author.context.request.post("/api/Post/add-post", {
    multipart: { Images: { name: "a.png", mimeType: "image/png", buffer: PNG } },
  });
  const postId = (await created.json()).data.postId as number;

  const like = () => fan.context.request.post(`/api/Post/like-post?postId=${postId}`);
  expect((await (await like()).json()).data).toEqual({ isLiked: true, likeCount: 1 });
  const seen = await (await author.context.request.get(`/api/Post/get-post-by-id?id=${postId}`)).json();
  expect(seen.data.postLikeCount).toBe(1);
  expect(seen.data.userLikes[0].id).toBe(fan.me.userId);
  expect((await (await like()).json()).data).toEqual({ isLiked: false, likeCount: 0 });

  await author.context.close();
  await fan.context.close();
});

test("follow: idempotent, feed posthoi follow-shudaro nishon medihad", async ({ browser }) => {
  const a = await signedInContext(browser, "fa");
  const b = await signedInContext(browser, "fb");
  const created = await b.context.request.post("/api/Post/add-post", {
    multipart: { Images: { name: "b.png", mimeType: "image/png", buffer: PNG } },
  });
  const postId = (await created.json()).data.postId as number;

  const follow = () => a.context.request.post(`/api/FollowingRelationShip/add-following-relation-ship?followingUserId=${b.me.userId}`);
  await follow();
  const again = await (await follow()).json();
  expect(again.data).toEqual({ isFollowing: true, isRequested: false, subscribersCount: 1 });

  const isFollow = await (await a.context.request.get(`/api/UserProfile/get-is-follow-user-profile-by-id?followingUserId=${b.me.userId}`)).json();
  expect(isFollow.data).toBe(true);
  const feed = await (await a.context.request.get("/api/Post/get-following-post")).json();
  expect(feed.data.map((p: { postId: number }) => p.postId)).toContain(postId);

  const self = await a.context.request.post(`/api/FollowingRelationShip/add-following-relation-ship?followingUserId=${a.me.userId}`);
  expect(self.status()).toBe(400);

  await a.context.close();
  await b.context.close();
});
