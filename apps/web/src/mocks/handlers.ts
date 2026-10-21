import { http, HttpResponse } from "msw";
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
  createMockPost({ postId: 1, userId: mockUsers[1].id, userName: mockUsers[1].userName }),
  createMockPost({ postId: 2, userId: mockUsers[2].id, userName: mockUsers[2].userName }),
  createMockPost({ postId: 3, userId: mockMe.userId, userName: mockMe.userName }),
];

const mockStories = [
  createMockStories({ userId: mockMe.userId, userName: mockMe.userName, hasUnseen: false }),
  createMockStories({ userId: mockUsers[1].id, userName: mockUsers[1].userName, hasUnseen: true }),
];

const mockNotifications = [
  createMockNotification({ id: 1, type: "LIKE" }),
  createMockNotification({ id: 2, type: "FOLLOW", post: null }),
];

export const handlers = [
      http.get("/api/images/:name", () =>
    new HttpResponse(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750"><rect width="100%" height="100%" fill="#8e8e8e"/></svg>',
      { headers: { "Content-Type": "image/svg+xml" } },
    ),
  ),

    http.post("/api/FollowingRelationShip/add-following-relation-ship", () =>
    HttpResponse.json({
      data: { isFollowing: true, subscribersCount: 1 },
      errors: [],
      statusCode: 200,
    }),
  ),
  
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
    const profile = createMockUserProfile({
      userId: id,
      userName: found?.userName ?? "ali",
      fullName: found?.fullName ?? "Ali Valiev",
    });
    return HttpResponse.json({ data: profile, errors: [], statusCode: 200 });
  }),

  http.get("/api/User/get-users", ({ request }) => {
    const q = (new URL(request.url).searchParams.get("UserName") ?? "").toLowerCase();
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

  http.get("/api/Post/get-explore-posts", () =>
    HttpResponse.json({
      pageNumber: 1,
      pageSize: 24,
      totalPage: 1,
      totalRecord: mockPosts.length,
      data: mockPosts,
      errors: [],
      statusCode: 200,
    }),
  ),

  http.get("/api/Post/get-post-by-id", ({ request }) => {
    const id = Number(new URL(request.url).searchParams.get("id") ?? "1");
    const post = mockPosts.find((p) => p.postId === id) ?? mockPosts[0];
    return HttpResponse.json({ data: post, errors: [], statusCode: 200 });
  }),

  http.post("/api/Post/like-post", ({ request }) => {
    const id = Number(new URL(request.url).searchParams.get("postId") ?? "1");
    const post = mockPosts.find((p) => p.postId === id) ?? mockPosts[0];
    post.postLike = !post.postLike;
    post.postLikeCount += post.postLike ? 1 : -1;
    return HttpResponse.json({
      data: { isLiked: post.postLike, likeCount: post.postLikeCount },
      errors: [],
      statusCode: 200,
    });
  }),

  http.post("/api/Post/add-post-favorite", async ({ request }) => {
    const body = (await request.json().catch(() => ({ postId: 1 }))) as { postId: number };
    const post = mockPosts.find((p) => p.postId === body.postId) ?? mockPosts[0];
    post.postFavorite = !post.postFavorite;
    return HttpResponse.json({
      data: { isFavorite: post.postFavorite },
      errors: [],
      statusCode: 200,
    });
  }),

  http.post("/api/Post/add-comment", async ({ request }) => {
    const body = (await request.json()) as { postId: number; comment: string; parentId?: number | null };
    const created = createMockComment(body.postId, {
      userId: mockMe.userId,
      userName: mockMe.userName,
      comment: body.comment,
      parentId: body.parentId ?? null,
    });
    return HttpResponse.json({ data: created, errors: [], statusCode: 200 });
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
    HttpResponse.json({ data: { count: 1 }, errors: [], statusCode: 200 }),
  ),

  http.put("/api/Notification/read-all", () =>
    HttpResponse.json({ data: true, errors: [], statusCode: 200 }),
  ),

  http.get("/api/Chat/get-unread-count", () =>
    HttpResponse.json({ data: { count: 0 }, errors: [], statusCode: 200 }),
  ),
];