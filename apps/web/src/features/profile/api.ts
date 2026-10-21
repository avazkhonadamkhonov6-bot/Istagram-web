import {
  followResultSchema,
  postDtoSchema,
  userListItemSchema,
  userProfileSchema,
  userShortSchema,
  type FollowResult,
  type PostDto,
  type UserListItem,
  type UserProfile,
  type UserShort,
} from "@repo/shared";
import { api } from "@/lib/api-client";

export const GRID_PAGE_SIZE = 12;

export async function getProfileByUsername(
  username: string,
): Promise<UserProfile | null> {
  const users = await api<UserListItem[]>(
    `/User/get-users?UserName=${encodeURIComponent(username)}&PageSize=20`,
    { schema: userListItemSchema.array() },
  );
  const hit = users.find(
    (u) => u.userName.toLowerCase() === username.toLowerCase(),
  );
  if (!hit) return null;
  return api<UserProfile>(`/UserProfile/get-user-profile-by-id?id=${hit.id}`, {
    schema: userProfileSchema,
  });
}

export const getIsFollowing = (userId: string) =>
  api<boolean>(
    `/UserProfile/get-is-follow-user-profile-by-id?followingUserId=${userId}`,
  );

export const getUserPosts = (userId: string, page: number) =>
  api<PostDto[]>(
    `/Post/get-posts?UserId=${userId}&PageNumber=${page}&PageSize=${GRID_PAGE_SIZE}`,
    { schema: postDtoSchema.array() },
  );

export const getSavedPage = (page: number) =>
  api<PostDto[]>(
    `/UserProfile/get-post-favorites?PageNumber=${page}&PageSize=${GRID_PAGE_SIZE}`,
    { schema: postDtoSchema.array() },
  );

export const getSubscribers = (userId: string) =>
  api<UserShort[]>(`/FollowingRelationShip/get-subscribers?UserId=${userId}`, {
    schema: userShortSchema.array(),
  });

export const getSubscriptions = (userId: string) =>
  api<UserShort[]>(
    `/FollowingRelationShip/get-subscriptions?UserId=${userId}`,
    { schema: userShortSchema.array() },
  );

export const followUser = (userId: string) =>
  api<FollowResult>(
    `/FollowingRelationShip/add-following-relation-ship?followingUserId=${userId}`,
    { method: "POST", schema: followResultSchema },
  );

export const unfollowUser = (userId: string) =>
  api<FollowResult>(
    `/FollowingRelationShip/delete-following-relation-ship?followingUserId=${userId}`,
    { method: "DELETE", schema: followResultSchema },
  );