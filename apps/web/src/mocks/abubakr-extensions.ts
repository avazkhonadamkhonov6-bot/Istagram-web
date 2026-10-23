import { http, HttpResponse } from "msw";
import type {
  CollectionDto,
  HighlightDto,
  PostDto,
  UserProfile,
  UserStories,
} from "@repo/shared";
const ok = (data: unknown) =>
  HttpResponse.json({ data, errors: [], statusCode: 200 });
const fail = () =>
  HttpResponse.json(
    { data: null, errors: ["Not found"], statusCode: 404 },
    { status: 404 },
  );
export function abubakrExtensions(
  me: UserProfile,
  posts: PostDto[],
  stories: UserStories[],
) {
  const collections: CollectionDto[] = [];
  const items = new Map<number, Set<number>>();
  const highlights: (HighlightDto & { ids: number[]; userId: string })[] = [];
  const relations = new Map<
    string,
    {
      followStatus: string;
      followsMe: boolean;
      isBlocked: boolean;
      isMutedPosts: boolean;
      isMutedStories: boolean;
      isRestricted: boolean;
      isCloseFriend: boolean;
      isFavorite: boolean;
    }
  >();
  const allStories = () => stories.flatMap((u) => u.stories);
  const queryId = (request: Request, name = "id") =>
    Number(new URL(request.url).searchParams.get(name));
  const paged = (data: PostDto[], request: Request) => {
    const q = new URL(request.url).searchParams;
    const size = Number(q.get("PageSize") ?? 12);
    const page = Number(q.get("PageNumber") ?? 1);
    return HttpResponse.json({
      data: data.slice((page - 1) * size, page * size),
      errors: [],
      statusCode: 200,
      totalPage: Math.ceil(data.length / size),
      pageNumber: page,
    });
  };
  return [
    http.get("/api/Live/get-lives", () => ok([])),
    http.get("/api/Post/get-my-posts", () =>
      ok(posts.filter((p) => p.userId === me.userId && !p.isArchived)),
    ),
    http.get("/api/Post/get-tagged-posts", ({ request }) =>
      paged(
        posts.filter((p) =>
          p.tags.some(
            (t) => t.userId === new URL(request.url).searchParams.get("UserId"),
          ),
        ),
        request,
      ),
    ),
    http.put("/api/Post/update-post", async ({ request }) => {
      const body = (await request.json()) as Partial<PostDto> & {
        postId: number;
      };
      const post = posts.find((p) => p.postId === body.postId);
      if (!post || post.userId !== me.userId) return fail();
      Object.assign(post, body);
      return ok(post);
    }),
    ...["archive", "pin"].map((kind) =>
      http.post(`/api/Post/${kind}-post`, ({ request }) => {
        const post = posts.find((p) => p.postId === queryId(request, "postId"));
        if (!post || post.userId !== me.userId) return fail();
        if (kind === "archive") post.isArchived = !post.isArchived;
        else post.isPinned = !post.isPinned;
        return ok({
          value: kind === "archive" ? post.isArchived : post.isPinned,
        });
      }),
    ),
    http.get("/api/Collection/get-collections", () =>
      ok(
        collections.map((c) => ({
          ...c,
          postsCount: items.get(c.id)?.size ?? 0,
        })),
      ),
    ),
    http.post("/api/Collection/add-collection", async ({ request }) => {
      const { name } = (await request.json()) as { name: string };
      const c = { id: Date.now(), name, postsCount: 0, cover: null };
      collections.push(c);
      items.set(c.id, new Set());
      return ok(c);
    }),
    http.put("/api/Collection/update-collection", async ({ request }) => {
      const body = (await request.json()) as { id: number; name: string };
      const c = collections.find((c) => c.id === body.id);
      if (!c) return fail();
      c.name = body.name;
      return ok(true);
    }),
    http.delete("/api/Collection/delete-collection", ({ request }) => {
      const i = collections.findIndex((c) => c.id === queryId(request));
      if (i < 0) return fail();
      items.delete(collections[i].id);
      collections.splice(i, 1);
      return ok(true);
    }),
    http.post("/api/Collection/add-to-collection", async ({ request }) => {
      const { collectionId, postId } = (await request.json()) as {
        collectionId: number;
        postId: number;
      };
      const set = items.get(collectionId);
      if (!set) return fail();
      set.add(postId);
      const post = posts.find((p) => p.postId === postId);
      if (post) post.postFavorite = true;
      return ok(true);
    }),
    http.delete("/api/Collection/remove-from-collection", ({ request }) => {
      items
        .get(queryId(request, "collectionId"))
        ?.delete(queryId(request, "postId"));
      return ok(true);
    }),
    http.get("/api/Collection/get-collection-posts", ({ request }) =>
      paged(
        posts.filter((p) =>
          items.get(queryId(request, "collectionId"))?.has(p.postId),
        ),
        request,
      ),
    ),
    http.get("/api/Highlight/get-highlights", ({ request }) =>
      ok(
        highlights.filter(
          (h) => h.userId === new URL(request.url).searchParams.get("UserId"),
        ),
      ),
    ),
    http.get("/api/Highlight/get-highlight-stories", ({ request }) =>
      ok(
        allStories().filter((s) =>
          highlights.find((h) => h.id === queryId(request))?.ids.includes(s.id),
        ),
      ),
    ),
    http.post("/api/Highlight/add-highlight", async ({ request }) => {
      const body = (await request.json()) as {
        title: string;
        storyIds: number[];
      };
      const id = Date.now();
      highlights.push({
        id,
        title: body.title,
        ids: body.storyIds,
        userId: me.userId,
        storiesCount: body.storyIds.length,
        cover: null,
      });
      return ok(id);
    }),
    http.put("/api/Highlight/update-highlight", async ({ request }) => {
      const body = (await request.json()) as {
        id: number;
        title: string;
        storyIds: number[];
      };
      const h = highlights.find((h) => h.id === body.id);
      if (!h) return fail();
      Object.assign(h, {
        title: body.title,
        ids: body.storyIds,
        storiesCount: body.storyIds.length,
      });
      return ok(true);
    }),
    http.delete("/api/Highlight/delete-highlight", ({ request }) => {
      const i = highlights.findIndex((h) => h.id === queryId(request));
      if (i < 0) return fail();
      highlights.splice(i, 1);
      return ok(true);
    }),
    http.get("/api/Story/get-my-stories", () =>
      ok(stories.find((s) => s.userId === me.userId)),
    ),
    http.get("/api/Story/get-user-stories/:userId", ({ params }) =>
      ok(stories.find((s) => s.userId === params.userId)),
    ),
    http.get("/api/Story/get-story-archive", () =>
      ok(allStories().filter((s) => s.userId === me.userId)),
    ),
    http.get("/api/Story/GetStoryById", ({ request }) =>
      ok(allStories().find((s) => s.id === queryId(request))),
    ),
    http.get("/api/Story/get-story-viewers", () =>
      ok([
        {
          id: "00000000-0000-4000-8000-000000000002",
          userName: "ali",
          fullName: "Ali",
          avatar: null,
          liked: true,
        },
      ]),
    ),
    http.delete("/api/Story/DeleteStory", ({ request }) => {
      for (const user of stories)
        user.stories = user.stories.filter((s) => s.id !== queryId(request));
      return ok(true);
    }),
    http.get("/api/User/get-relation-status", ({ request }) => {
      const id = new URL(request.url).searchParams.get("userId")!;
      const status = relations.get(id) ?? {
        followStatus: "none",
        followsMe: false,
        isBlocked: false,
        isMutedPosts: false,
        isMutedStories: false,
        isRestricted: false,
        isCloseFriend: false,
        isFavorite: false,
      };
      relations.set(id, status);
      return ok(status);
    }),
    ...(
      [
        ["restrict-user", "isRestricted", true],
        ["unrestrict-user", "isRestricted", false],
        ["mute-user", "isMutedPosts", true],
        ["unmute-user", "isMutedPosts", false],
        ["add-close-friend", "isCloseFriend", true],
        ["remove-close-friend", "isCloseFriend", false],
        ["add-favorite", "isFavorite", true],
        ["remove-favorite", "isFavorite", false],
        ["block-user", "isBlocked", true],
      ] as const
    ).map(([path, key, value]) =>
      (value ? http.post : http.delete)(`/api/User/${path}`, ({ request }) => {
        const r = relations.get(
          new URL(request.url).searchParams.get("userId")!,
        );
        if (r) r[key] = value;
        return ok(true);
      }),
    ),
    http.post("/api/Report/add-report", () => ok(true)),
    http.get("/api/Location/get-Locations", () =>
      ok([
        {
          locationId: 1,
          city: "Dushanbe",
          state: "Dushanbe",
          country: "Tajikistan",
          zipCode: "734000",
        },
      ]),
    ),
    http.get("/api/Location/get-Location-by-id", () =>
      ok({
        locationId: 1,
        city: "Dushanbe",
        state: "Dushanbe",
        country: "Tajikistan",
        zipCode: "734000",
      }),
    ),
    http.delete("/api/Account/ForgotPassword", () => ok("Code sent")),
    http.delete("/api/Account/ResetPassword", async ({ request }) =>
      new URL(request.url).searchParams.get("Token") === "test-code"
        ? ok("Password reset")
        : HttpResponse.json(
            { data: null, errors: ["INVALID_RESET_TOKEN"], statusCode: 400 },
            { status: 400 },
          ),
    ),
  ];
}
