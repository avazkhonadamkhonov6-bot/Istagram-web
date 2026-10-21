import {
  collectionDtoSchema,
  getStoryDtoSchema,
  highlightDtoSchema,
  likeResultSchema,
  messageDtoSchema,
  postDtoSchema,
  relationStatusSchema,
  toggleResultSchema,
  userShortSchema,
  userStoriesSchema,
  type AddReportDto,
  type CollectionDto,
  type GetStoryDto,
  type HighlightDto,
  type MessageDto,
  type PostDto,
  type RelationStatus,
  type UpdatePostDto,
  type UserShort,
  type UserStories,
} from "@repo/shared";
import { api } from "@/lib/api-client";

/** Endpoint-hoi Spec 14 (va Story-i Spec 12) tavassuti BFF */

const json = (body: unknown) => ({ headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

// ---- Stories ----
export const getStoriesFeed = () => api<UserStories[]>("/Story/get-stories", { schema: userStoriesSchema.array() });
export const getUserStories = (userId: string) => api<UserStories>(`/Story/get-user-stories/${userId}`, { schema: userStoriesSchema });
export const viewStory = (storyId: number) => api<unknown>(`/Story/add-story-view?StoryId=${storyId}`, { method: "POST" });
export const likeStory = (storyId: number) => api<string>(`/Story/LikeStory?storyId=${storyId}`, { method: "POST" });
export const deleteStory = (id: number) => api<boolean>(`/Story/DeleteStory?id=${id}`, { method: "DELETE" });
export const replyStory = (storyId: number, text: string) =>
  api<MessageDto>("/Story/reply-story", { method: "POST", ...json({ storyId, text }), schema: messageDtoSchema });
export const getStoryArchive = () => api<GetStoryDto[]>("/Story/get-story-archive", { schema: getStoryDtoSchema.array() });
export type StoryViewer = UserShort & { liked: boolean };
export const getStoryViewers = (storyId: number) => api<StoryViewer[]>(`/Story/get-story-viewers?storyId=${storyId}`);

export function addStory(file: File, closeFriends: boolean) {
  const form = new FormData();
  form.set("Image", file);
  return api<string>(`/Story/AddStories?CloseFriends=${closeFriends}`, { method: "POST", body: form });
}

// ---- Highlights ----
export const getHighlights = (userId: string) =>
  api<HighlightDto[]>(`/Highlight/get-highlights?UserId=${userId}`, { schema: highlightDtoSchema.array() });
export const getHighlightStories = (id: number) =>
  api<GetStoryDto[]>(`/Highlight/get-highlight-stories?id=${id}`, { schema: getStoryDtoSchema.array() });
export const addHighlight = (title: string, storyIds: number[]) =>
  api<number>("/Highlight/add-highlight", { method: "POST", ...json({ title, storyIds }) });
export const deleteHighlight = (id: number) => api<boolean>(`/Highlight/delete-highlight?id=${id}`, { method: "DELETE" });

// ---- Postho ----
export const PAGE_SIZE = 12;
const posts = (path: string) => api<PostDto[]>(path, { schema: postDtoSchema.array() });
export const getReels = (page: number) => posts(`/Post/get-reels?PageNumber=${page}&PageSize=5`);
export const getTagged = (userId: string, page: number) => posts(`/Post/get-tagged-posts?UserId=${userId}&PageNumber=${page}&PageSize=${PAGE_SIZE}`);
export const getLocationPosts = (name: string, page: number) =>
  posts(`/Post/get-location-posts?Name=${encodeURIComponent(name)}&PageNumber=${page}&PageSize=${PAGE_SIZE}`);
export const getArchived = (page: number) => posts(`/Post/get-archived-posts?PageNumber=${page}&PageSize=${PAGE_SIZE}`);
export const updatePost = (dto: UpdatePostDto) => api<PostDto>("/Post/update-post", { method: "PUT", ...json(dto), schema: postDtoSchema });
export const archivePost = (postId: number) => api<{ value: boolean }>(`/Post/archive-post?postId=${postId}`, { method: "POST", schema: toggleResultSchema });
export const pinPost = (postId: number) => api<{ value: boolean }>(`/Post/pin-post?postId=${postId}`, { method: "POST", schema: toggleResultSchema });
export const deletePost = (id: number) => api<boolean>(`/Post/delete-post?id=${id}`, { method: "DELETE" });
export const likeComment = (commentId: number) =>
  api<{ isLiked: boolean; likeCount: number }>(`/Post/like-comment?commentId=${commentId}`, { method: "POST", schema: likeResultSchema });
export const viewPost = (postId: number) => api<unknown>(`/Post/view-post?postId=${postId}`, { method: "POST" });

export type NewPost = { files: File[]; caption: string; location: string; tags: { userName: string; x: number; y: number; imageIndex: number }[] };
export function addPost({ files, caption, location, tags }: NewPost) {
  const form = new FormData();
  files.forEach((f) => form.append("Images", f));
  if (caption) form.set("Content", caption);
  if (location) form.set("Location", location);
  if (tags.length) form.set("Tags", JSON.stringify(tags));
  return api<PostDto>("/Post/add-post", { method: "POST", body: form, schema: postDtoSchema });
}

// ---- Collections ----
export const getCollections = () => api<CollectionDto[]>("/Collection/get-collections", { schema: collectionDtoSchema.array() });
export const addCollection = (name: string) =>
  api<CollectionDto>("/Collection/add-collection", { method: "POST", ...json({ name }), schema: collectionDtoSchema });
export const deleteCollection = (id: number) => api<boolean>(`/Collection/delete-collection?id=${id}`, { method: "DELETE" });
export const addToCollection = (collectionId: number, postId: number) =>
  api<boolean>("/Collection/add-to-collection", { method: "POST", ...json({ collectionId, postId }) });
export const getCollectionPosts = (collectionId: number, page: number) =>
  posts(`/Collection/get-collection-posts?collectionId=${collectionId}&PageNumber=${page}&PageSize=${PAGE_SIZE}`);

// ---- Relations (block, mute, restrict, close friends) ----
export type RelationList = "blocked" | "muted" | "restricted" | "close-friends";
const LIST_PATH: Record<RelationList, string> = {
  blocked: "/User/get-blocked-users",
  muted: "/User/get-muted-users",
  restricted: "/User/get-restricted-users",
  "close-friends": "/User/get-close-friends",
};
export const getRelationList = (kind: RelationList) => api<UserShort[]>(LIST_PATH[kind], { schema: userShortSchema.array() });
export const getRelationStatus = (userId: string) =>
  api<RelationStatus>(`/User/get-relation-status?userId=${userId}`, { schema: relationStatusSchema });

export type RelationAction =
  | "block"
  | "unblock"
  | "restrict"
  | "unrestrict"
  | "mute"
  | "unmute"
  | "add-close-friend"
  | "remove-close-friend";
const ACTION: Record<RelationAction, [string, "POST" | "DELETE"]> = {
  block: ["/User/block-user", "POST"],
  unblock: ["/User/unblock-user", "DELETE"],
  restrict: ["/User/restrict-user", "POST"],
  unrestrict: ["/User/unrestrict-user", "DELETE"],
  mute: ["/User/mute-user", "POST"],
  unmute: ["/User/unmute-user", "DELETE"],
  "add-close-friend": ["/User/add-close-friend", "POST"],
  "remove-close-friend": ["/User/remove-close-friend", "DELETE"],
};
export function relationAction(action: RelationAction, userId: string) {
  const [path, method] = ACTION[action];
  return api<boolean>(`${path}?userId=${userId}`, { method });
}

export const report = (dto: AddReportDto) => api<boolean>("/Report/add-report", { method: "POST", ...json(dto) });

// ---- Follow requests va privacy ----
export const getFollowRequests = () => api<UserShort[]>("/FollowingRelationShip/get-follow-requests", { schema: userShortSchema.array() });
export const acceptRequest = (userId: string) => api<boolean>(`/FollowingRelationShip/accept-follow-request?userId=${userId}`, { method: "POST" });
export const declineRequest = (userId: string) => api<boolean>(`/FollowingRelationShip/decline-follow-request?userId=${userId}`, { method: "DELETE" });
export const getFollowStatus = (userId: string) => api<"none" | "requested" | "following">(`/UserProfile/get-follow-status?userId=${userId}`);
export const updatePrivacy = (isPrivate: boolean) => api<unknown>("/UserProfile/update-privacy", { method: "PUT", ...json({ isPrivate }) });

// ---- Direct: share ----
export function sharePost(chatId: number, postId: number, storyId?: number) {
  const form = new FormData();
  form.set("ChatId", String(chatId));
  if (postId) form.set("SharedPostId", String(postId));
  if (storyId) form.set("SharedStoryId", String(storyId));
  return api<MessageDto>("/Chat/send-message", { method: "PUT", body: form, schema: messageDtoSchema });
}
