import { http, HttpResponse } from "msw";
import {
  postDtoSchema,
  messageDtoSchema,
  userStoriesSchema,
  type CommentDto,
} from "@repo/shared";
import {
  createMockComment,
  createMockNotification,
  createMockPost,
  createMockStories,
  createMockUserListItem,
  createMockUserProfile,
} from "./factories";

const mockMe = createMockUserProfile({
  userId: "00000000-0000-4000-8000-000000000001",
  userName: "abubakr",
  fullName: "Abubakr Qurbonov",
  email: "abubakr@example.com",
  about: "Frontend Developer · Dushanbe",
  postCount: 3,
  subscribersCount: 128,
  subscriptionsCount: 95,
});

const mockUsers = [
  createMockUserListItem({
    id: mockMe.userId,
    userName: mockMe.userName,
    fullName: mockMe.fullName,
    email: mockMe.email,
    subscribersCount: mockMe.subscribersCount,
  }),
  createMockUserListItem({
    id: "00000000-0000-4000-8000-000000000002",
    userName: "ali",
    fullName: "Ali Valiev",
    email: "ali@example.com",
    subscribersCount: 340,
  }),
  createMockUserListItem({
    id: "00000000-0000-4000-8000-000000000003",
    userName: "dushanbe.life",
    fullName: "Dushanbe City",
    email: "city@example.com",
    subscribersCount: 1250,
  }),
];

const mockPosts = [
  createMockPost({
    postId: 1,
    userId: mockUsers[1].id,
    userName: mockUsers[1].userName,
  }),
  createMockPost({
    postId: 2,
    userId: mockUsers[2].id,
    userName: mockUsers[2].userName,
  }),
  createMockPost({
    postId: 3,
    userId: mockMe.userId,
    userName: mockMe.userName,
  }),
];

const mockStories = [
  createMockStories({
    userId: mockMe.userId,
    userName: mockMe.userName,
    hasUnseen: false,
  }),
  createMockStories({
    userId: mockUsers[1].id,
    userName: mockUsers[1].userName,
    hasUnseen: true,
  }),
];

const mockNotifications = [
  createMockNotification({ id: 1, type: "LIKE" }),
  createMockNotification({ id: 2, type: "FOLLOW", post: null }),
];

const followed = new Set<string>();

const mockHashtags = [
  { name: "travel", postsCount: 128 },
  { name: "pamir", postsCount: 42 },
  { name: "tajikistan", postsCount: 87 },
  { name: "food", postsCount: 310 },
];

// Distinct posts remain addressable from Explore and its post modal.
const explorePool = Array.from({ length: 30 }, (_, i) => {
  const p = mockPosts[i % mockPosts.length];
  return { ...p, postId: p.postId + 1000 * Math.floor(i / mockPosts.length) };
});

function pagedMock<T>(items: T[], params: URLSearchParams) {
  const page = Number(params.get("PageNumber") ?? "1");
  const size = Number(params.get("PageSize") ?? "24");
  return HttpResponse.json({
    pageNumber: page,
    pageSize: size,
    totalPage: Math.max(1, Math.ceil(items.length / size)),
    totalRecord: items.length,
    data: items.slice((page - 1) * size, page * size),
    errors: [],
    statusCode: 200,
  });
}

let nextHistoryId = 1;
const userHistory: {
  id: number;
  createdAt: string;
  users: {
    id: string;
    userName: string;
    fullName: string | null;
    avatar: string | null;
  };
}[] = [];
const textHistory: { id: number; text: string; createdAt: string }[] = [];

const mockFiles = new Map<string, File>();

export const handlers = [
  // FE-07 / Spec 13: Share dialog uses these two existing Direct endpoints.
  http.post("/api/Chat/create-chat", ({ request }) => {
    const id = new URL(request.url).searchParams.get("receiverUserId");
    const receiver = mockUsers.find((u) => u.id === id);
    if (!receiver)
      return HttpResponse.json(
        { data: null, errors: ["User not found"], statusCode: 404 },
        { status: 404 },
      );
    return HttpResponse.json({
      data: mockUsers.indexOf(receiver) + 1,
      errors: [],
      statusCode: 200,
    });
  }),
  http.put("/api/Chat/send-message", async ({ request }) => {
    const form = await request.formData();
    const postId = Number(form.get("SharedPostId"));
    const post = [...mockPosts, ...explorePool].find(
      (p) => p.postId === postId,
    );
    if (!post)
      return HttpResponse.json(
        { data: null, errors: ["Post not found"], statusCode: 404 },
        { status: 404 },
      );
    const message = messageDtoSchema.parse({
      messageId: Date.now(),
      chatId: Number(form.get("ChatId")),
      userId: mockMe.userId,
      userName: mockMe.userName,
      userImage: mockMe.image,
      messageText: null,
      file: null,
      sendMassageDate: new Date().toISOString(),
      sharedPost: {
        postId: post.postId,
        image: post.images[0] ?? null,
        userName: post.userName,
      },
    });
    return HttpResponse.json({ data: message, errors: [], statusCode: 200 });
  }),
  http.delete("/api/Post/delete-post", ({ request }) => {
    const id = Number(new URL(request.url).searchParams.get("id"));
    const index = mockPosts.findIndex(
      (p) => p.postId === id && p.userId === mockMe.userId,
    );
    if (index < 0)
      return HttpResponse.json(
        { data: null, errors: ["Not allowed"], statusCode: 403 },
        { status: 403 },
      );
    mockPosts.splice(index, 1);
    mockMe.postCount--;
    return HttpResponse.json({ data: true, errors: [], statusCode: 200 });
  }),
  http.post("/api/Post/add-post", async ({ request }) => {
    const form = await request.formData();
    const files = form
      .getAll("Images")
      .filter((f): f is File => f instanceof File);
    if (!files.length || files.length > 10)
      return HttpResponse.json(
        { data: null, errors: ["Choose 1–10 files"], statusCode: 400 },
        { status: 400 },
      );
    const post = createMockPost({
      postId: Math.max(...mockPosts.map((p) => p.postId)) + 1,
      userId: mockMe.userId,
      userName: mockMe.userName,
      content: String(form.get("Content") ?? ""),
      images: files.map((f) => {
        const name = `upload-${crypto.randomUUID()}-${f.name}`;
        mockFiles.set(name, f);
        return name;
      }),
      isReel: files.length === 1 && files[0].type.startsWith("video/"),
      postLikeCount: 0,
      commentCount: 0,
      comments: [],
    });
    mockPosts.unshift(post);
    mockMe.postCount++;
    return HttpResponse.json({
      data: postDtoSchema.parse(post),
      errors: [],
      statusCode: 200,
    });
  }),
  http.get("/api/Post/get-reels", ({ request }) =>
    pagedMock(
      mockPosts.filter((p) => p.isReel),
      new URL(request.url).searchParams,
    ),
  ),
  http.post("/api/Post/view-post", ({ request }) => {
    const id = Number(new URL(request.url).searchParams.get("postId"));
    const post = mockPosts.find((p) => p.postId === id);
    return HttpResponse.json({
      data: { viewCount: post?.postView ?? 1 },
      errors: [],
      statusCode: 200,
    });
  }),
  http.post("/api/Story/AddStories", async ({ request }) => {
    const form = await request.formData();
    const file = form.get("Image");
    if (!(file instanceof File))
      return HttpResponse.json(
        { data: null, errors: ["Select a file"], statusCode: 400 },
        { status: 400 },
      );
    const name = `story-${crypto.randomUUID()}-${file.name}`;
    mockFiles.set(name, file);
    const entry = createMockStories({
      userId: mockMe.userId,
      userName: mockMe.userName,
    });
    entry.stories[0].fileName = name;
    const own = mockStories.find((u) => u.userId === mockMe.userId);
    if (own) own.stories.push(entry.stories[0]);
    else mockStories.unshift(entry);
    userStoriesSchema.parse(own ?? entry);
    return HttpResponse.json({
      data: "Story added",
      errors: [],
      statusCode: 200,
    });
  }),
  http.post("/api/Story/add-story-view", ({ request }) => {
    const id = Number(new URL(request.url).searchParams.get("StoryId"));
    for (const u of mockStories) {
      const story = u.stories.find((s) => s.id === id);
      if (story) story.viewed = true;
      u.hasUnseen = u.stories.some((s) => !s.viewed);
    }
    return HttpResponse.json({
      data: { id: 1, viewUserId: mockMe.userId, storyId: id },
      errors: [],
      statusCode: 200,
    });
  }),
  http.post("/api/Story/LikeStory", ({ request }) => {
    const id = Number(new URL(request.url).searchParams.get("storyId"));
    const story = mockStories
      .flatMap((u) => u.stories)
      .find((s) => s.id === id);
    if (story) story.liked = !story.liked;
    return HttpResponse.json({
      data: story?.liked ? "Liked" : "Unliked",
      errors: [],
      statusCode: 200,
    });
  }),

  http.get("/api/Post/get-explore-posts", ({ request }) =>
    pagedMock(explorePool, new URL(request.url).searchParams),
  ),

  http.get("/api/Hashtag/search", ({ request }) => {
    const q = (new URL(request.url).searchParams.get("Query") ?? "")
      .replace(/^#/, "")
      .toLowerCase();
    return HttpResponse.json({
      data: mockHashtags.filter((h) => h.name.includes(q)),
      errors: [],
      statusCode: 200,
    });
  }),

  http.get("/api/Hashtag/get-posts", ({ request }) =>
    pagedMock(
      explorePool.filter((_, i) => i % 2 === 0),
      new URL(request.url).searchParams,
    ),
  ),

  http.post("/api/User/add-user-search-history", ({ request }) => {
    const id = new URL(request.url).searchParams.get("UserSearchId") ?? "";
    const u = mockUsers.find((x) => x.id === id);
    if (!u) {
      return HttpResponse.json(
        { data: null, errors: ["User not found"], statusCode: 404 },
        { status: 404 },
      );
    }
    const old = userHistory.findIndex((h) => h.users.id === id);
    if (old >= 0) userHistory.splice(old, 1);
    const entry = {
      id: nextHistoryId++,
      createdAt: new Date().toISOString(),
      users: {
        id: u.id,
        userName: u.userName,
        fullName: u.fullName ?? null,
        avatar: u.avatar ?? null,
      },
    };
    userHistory.push(entry);
    return HttpResponse.json({ data: entry, errors: [], statusCode: 200 });
  }),

  http.get("/api/User/get-user-search-histories", () =>
    HttpResponse.json({ data: userHistory, errors: [], statusCode: 200 }),
  ),

  http.delete("/api/User/delete-user-search-history", ({ request }) => {
    const id = Number(new URL(request.url).searchParams.get("id"));
    const i = userHistory.findIndex((h) => h.id === id);
    if (i >= 0) userHistory.splice(i, 1);
    return HttpResponse.json({ data: true, errors: [], statusCode: 200 });
  }),

  http.delete("/api/User/delete-user-search-histories", () => {
    userHistory.length = 0;
    return HttpResponse.json({ data: true, errors: [], statusCode: 200 });
  }),

  http.post("/api/User/add-search-history", ({ request }) => {
    const text = new URL(request.url).searchParams.get("Text") ?? "";
    const old = textHistory.findIndex((h) => h.text === text);
    if (old >= 0) textHistory.splice(old, 1);
    const entry = {
      id: nextHistoryId++,
      text,
      createdAt: new Date().toISOString(),
    };
    textHistory.push(entry);
    return HttpResponse.json({ data: entry, errors: [], statusCode: 200 });
  }),

  http.get("/api/User/get-search-histories", () =>
    HttpResponse.json({ data: textHistory, errors: [], statusCode: 200 }),
  ),

  http.delete("/api/User/delete-search-history", ({ request }) => {
    const id = Number(new URL(request.url).searchParams.get("id"));
    const i = textHistory.findIndex((h) => h.id === id);
    if (i >= 0) textHistory.splice(i, 1);
    return HttpResponse.json({ data: true, errors: [], statusCode: 200 });
  }),

  http.delete("/api/User/delete-search-histories", () => {
    textHistory.length = 0;
    return HttpResponse.json({ data: true, errors: [], statusCode: 200 });
  }),

  http.put("/api/UserProfile/update-user-profile", async ({ request }) => {
    const body = (await request.json()) as { about?: string; gender?: 0 | 1 };
    Object.assign(mockMe, body);
    return HttpResponse.json({ data: mockMe, errors: [], statusCode: 200 });
  }),

  http.put("/api/UserProfile/update-user-image-profile", () => {
    mockMe.image = "mock-avatar.jpg";
    return HttpResponse.json({ data: mockMe, errors: [], statusCode: 200 });
  }),

  http.delete("/api/UserProfile/delete-user-image-profile", () => {
    mockMe.image = null;
    return HttpResponse.json({ data: mockMe, errors: [], statusCode: 200 });
  }),

  http.put("/api/Account/ChangePassword", ({ request }) => {
    const old = new URL(request.url).searchParams.get("OldPassword");
    if (old === "wrongpass") {
      return HttpResponse.json(
        { data: null, errors: ["Old password is incorrect"], statusCode: 400 },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      data: "Password changed",
      errors: [],
      statusCode: 200,
    });
  }),

  http.get("/api/images/:name", ({ params }) => {
    const file = mockFiles.get(String(params.name));
    if (file)
      return new HttpResponse(file, { headers: { "Content-Type": file.type } });
    return new HttpResponse(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750"><rect width="100%" height="100%" fill="#8e8e8e"/></svg>',
      { headers: { "Content-Type": "image/svg+xml" } },
    );
  }),

  http.post(
    "/api/FollowingRelationShip/add-following-relation-ship",
    ({ request }) => {
      followed.add(
        new URL(request.url).searchParams.get("followingUserId") ?? "",
      );
      return HttpResponse.json({
        data: { isFollowing: true, subscribersCount: 100 + followed.size },
        errors: [],
        statusCode: 200,
      });
    },
  ),

  http.delete(
    "/api/FollowingRelationShip/delete-following-relation-ship",
    ({ request }) => {
      followed.delete(
        new URL(request.url).searchParams.get("followingUserId") ?? "",
      );
      return HttpResponse.json({
        data: { isFollowing: false, subscribersCount: 100 + followed.size },
        errors: [],
        statusCode: 200,
      });
    },
  ),

  http.get(
    "/api/UserProfile/get-is-follow-user-profile-by-id",
    ({ request }) => {
      const id = new URL(request.url).searchParams.get("followingUserId") ?? "";
      return HttpResponse.json({
        data: followed.has(id),
        errors: [],
        statusCode: 200,
      });
    },
  ),

  http.get("/api/FollowingRelationShip/get-subscribers", () =>
    HttpResponse.json({ data: mockUsers, errors: [], statusCode: 200 }),
  ),

  http.get("/api/FollowingRelationShip/get-subscriptions", () =>
    HttpResponse.json({
      data: mockUsers.slice(1),
      errors: [],
      statusCode: 200,
    }),
  ),

  http.get("/api/Post/get-posts", ({ request }) => {
    const params = new URL(request.url).searchParams;
    const userId = params.get("UserId");
    const page = Number(params.get("PageNumber") ?? "1");
    const items = mockPosts.filter((p) => !userId || p.userId === userId);
    return HttpResponse.json({
      pageNumber: page,
      pageSize: 12,
      totalPage: 1,
      totalRecord: items.length,
      data: items.slice((page - 1) * 12, page * 12),
      errors: [],
      statusCode: 200,
    });
  }),

  http.get("/api/UserProfile/get-post-favorites", () => {
    const items = mockPosts.filter((p) => p.postFavorite);
    return HttpResponse.json({
      pageNumber: 1,
      pageSize: 12,
      totalPage: 1,
      totalRecord: items.length,
      data: items,
      errors: [],
      statusCode: 200,
    });
  }),

  http.get("/api/v1/feed", () =>
    HttpResponse.json({
      pageNumber: 1,
      pageSize: 10,
      totalPage: 1,
      totalRecord: mockPosts.length,
      data: mockPosts,
      errors: [],
      statusCode: 200,
    }),
  ),

  http.post("/api/auth/login", () =>
    HttpResponse.json({ data: mockMe, errors: [], statusCode: 200 }),
  ),

  http.post("/api/auth/register", () =>
    HttpResponse.json({ data: mockMe, errors: [], statusCode: 200 }),
  ),

  http.post("/api/auth/logout", () =>
    HttpResponse.json({ data: true, errors: [], statusCode: 200 }),
  ),

  http.get("/api/UserProfile/get-my-profile", () =>
    HttpResponse.json({ data: mockMe, errors: [], statusCode: 200 }),
  ),

  http.get("/api/UserProfile/get-user-profile-by-id", ({ request }) => {
    const id = new URL(request.url).searchParams.get("id") ?? mockMe.userId;
    const found = mockUsers.find((u) => u.id === id);
    if (id === mockMe.userId)
      return HttpResponse.json({ data: mockMe, errors: [], statusCode: 200 });
    const profile = createMockUserProfile({
      userId: id,
      userName: found?.userName ?? "ali",
      fullName: found?.fullName ?? "Ali Valiev",
    });
    return HttpResponse.json({ data: profile, errors: [], statusCode: 200 });
  }),

  http.get("/api/User/get-users", ({ request }) => {
    const q = (
      new URL(request.url).searchParams.get("UserName") ?? ""
    ).toLowerCase();
    const filtered = q
      ? mockUsers.filter(
          (u) =>
            u.userName.toLowerCase().includes(q) ||
            (u.fullName?.toLowerCase().includes(q) ?? false),
        )
      : mockUsers;
    return HttpResponse.json({
      pageNumber: 1,
      pageSize: 20,
      totalPage: 1,
      totalRecord: filtered.length,
      data: filtered,
      errors: [],
      statusCode: 200,
    });
  }),

  http.get("/api/User/get-suggestions", () =>
    HttpResponse.json({
      data: mockUsers.slice(1),
      errors: [],
      statusCode: 200,
    }),
  ),

  http.get("/api/Post/get-following-post", () =>
    HttpResponse.json({
      pageNumber: 1,
      pageSize: 10,
      totalPage: 1,
      totalRecord: mockPosts.length,
      data: mockPosts,
      errors: [],
      statusCode: 200,
    }),
  ),

  http.get("/api/Post/get-post-by-id", ({ request }) => {
    const id = Number(new URL(request.url).searchParams.get("id") ?? "1");
    const post = [...mockPosts, ...explorePool].find((p) => p.postId === id);
    if (!post)
      return HttpResponse.json(
        { data: null, errors: ["Post not found"], statusCode: 404 },
        { status: 404 },
      );
    return HttpResponse.json({ data: post, errors: [], statusCode: 200 });
  }),

  http.post("/api/Post/like-post", ({ request }) => {
    const id = Number(new URL(request.url).searchParams.get("postId") ?? "1");
    const post = [...mockPosts, ...explorePool].find((p) => p.postId === id);
    if (!post)
      return HttpResponse.json(
        { data: null, errors: ["Post not found"], statusCode: 404 },
        { status: 404 },
      );
    post.postLike = !post.postLike;
    post.postLikeCount += post.postLike ? 1 : -1;
    return HttpResponse.json({
      data: { isLiked: post.postLike, likeCount: post.postLikeCount },
      errors: [],
      statusCode: 200,
    });
  }),

  http.post("/api/Post/add-post-favorite", async ({ request }) => {
    const body = (await request.json().catch(() => ({ postId: 1 }))) as {
      postId: number;
    };
    const post = [...mockPosts, ...explorePool].find(
      (p) => p.postId === body.postId,
    );
    if (!post)
      return HttpResponse.json(
        { data: null, errors: ["Post not found"], statusCode: 404 },
        { status: 404 },
      );
    post.postFavorite = !post.postFavorite;
    return HttpResponse.json({
      data: { isFavorite: post.postFavorite },
      errors: [],
      statusCode: 200,
    });
  }),

  http.post("/api/Post/add-comment", async ({ request }) => {
    const body = (await request.json()) as {
      postId: number;
      comment: string;
      parentId?: number | null;
    };
    const created = createMockComment(body.postId, {
      userId: mockMe.userId,
      userName: mockMe.userName,
      comment: body.comment,
      parentId: body.parentId ?? null,
    });
    commentStore.push(created);
    if (created.parentId) {
      const parent = commentStore.find(
        (c) => c.postCommentId === created.parentId,
      );
      if (parent) parent.replyCount += 1;
    }
    const post = mockPosts.find((p) => p.postId === body.postId);
    if (post) post.commentCount += 1;
    return HttpResponse.json({ data: created, errors: [], statusCode: 200 });
  }),

  http.get("/api/Post/get-comments", ({ request }) => {
    const params = new URL(request.url).searchParams;
    const postId = Number(params.get("postId") ?? "1");
    const page = Number(params.get("PageNumber") ?? "1");
    const roots = commentStore.filter(
      (c) => c.postId === postId && c.parentId === null,
    );
    return HttpResponse.json({
      pageNumber: page,
      pageSize: 10,
      totalPage: Math.max(1, Math.ceil(roots.length / 10)),
      totalRecord: roots.length,
      data: roots.slice((page - 1) * 10, page * 10),
      errors: [],
      statusCode: 200,
    });
  }),

  http.get("/api/Post/get-comment-replies", ({ request }) => {
    const id = Number(new URL(request.url).searchParams.get("commentId"));
    return HttpResponse.json({
      data: commentStore.filter((c) => c.parentId === id),
      errors: [],
      statusCode: 200,
    });
  }),

  http.delete("/api/Post/delete-comment", ({ request }) => {
    const id = Number(new URL(request.url).searchParams.get("commentId"));
    const target = commentStore.find((c) => c.postCommentId === id);
    if (target) {
      const removed = commentStore.filter(
        (c) => c.postCommentId === id || c.parentId === id,
      );
      for (const r of removed) {
        commentStore.splice(commentStore.indexOf(r), 1);
      }
      if (target.parentId) {
        const parent = commentStore.find(
          (c) => c.postCommentId === target.parentId,
        );
        if (parent) parent.replyCount = Math.max(0, parent.replyCount - 1);
      }
      const post = mockPosts.find((p) => p.postId === target.postId);
      if (post)
        post.commentCount = Math.max(0, post.commentCount - removed.length);
    }
    return HttpResponse.json({ data: true, errors: [], statusCode: 200 });
  }),

  http.get("/api/Story/get-stories", () =>
    HttpResponse.json({ data: mockStories, errors: [], statusCode: 200 }),
  ),

  http.get("/api/Notification/get-notifications", () =>
    HttpResponse.json({
      pageNumber: 1,
      pageSize: 20,
      totalPage: 1,
      totalRecord: mockNotifications.length,
      data: mockNotifications,
      errors: [],
      statusCode: 200,
    }),
  ),

  http.get("/api/Notification/get-unread-count", () =>
    HttpResponse.json({
      data: { count: mockNotifications.filter((n) => !n.isRead).length },
      errors: [],
      statusCode: 200,
    }),
  ),

  http.put("/api/Notification/read-all", () => {
    mockNotifications.forEach((n) => {
      n.isRead = true;
    });
    return HttpResponse.json({ data: true, errors: [], statusCode: 200 });
  }),

  http.get("/api/Chat/get-unread-count", () =>
    HttpResponse.json({ data: { count: 0 }, errors: [], statusCode: 200 }),
  ),
];

const commentStore: CommentDto[] = mockPosts.flatMap((p) => p.comments);
const firstRoot = commentStore[0];
firstRoot.replyCount = 1;
commentStore.push(
  createMockComment(firstRoot.postId, { parentId: firstRoot.postCommentId }),
);
