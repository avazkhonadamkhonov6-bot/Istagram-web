import {
  hashtagDtoSchema,
  searchHistorySchema,
  userListItemSchema,
  userSearchHistorySchema,
  type HashtagDto,
  type SearchHistory,
  type UserListItem,
  type UserSearchHistory,
} from "@repo/shared";
import { api } from "@/lib/api-client";

export const searchUsers = (q: string) =>
  api<UserListItem[]>(
    `/User/get-users?UserName=${encodeURIComponent(q.slice(0, 30))}&PageSize=10`,
    { schema: userListItemSchema.array() },
  );

export const searchHashtags = (q: string) =>
  api<HashtagDto[]>(`/Hashtag/search?Query=${encodeURIComponent(q)}`, {
    schema: hashtagDtoSchema.array(),
  });

export const getRecentUsers = () =>
  api<UserSearchHistory[]>("/User/get-user-search-histories", {
    schema: userSearchHistorySchema.array(),
  });

export const getRecentTexts = () =>
  api<SearchHistory[]>("/User/get-search-histories", {
    schema: searchHistorySchema.array(),
  });

export const addUserHistory = (userId: string) =>
  api<UserSearchHistory>(
    `/User/add-user-search-history?UserSearchId=${userId}`,
    { method: "POST", schema: userSearchHistorySchema },
  );

export const addTextHistory = (text: string) =>
  api<SearchHistory>(
    `/User/add-search-history?Text=${encodeURIComponent(text)}`,
    { method: "POST", schema: searchHistorySchema },
  );

export const deleteUserHistory = (id: number) =>
  api<boolean>(`/User/delete-user-search-history?id=${id}`, {
    method: "DELETE",
  });

export const deleteTextHistory = (id: number) =>
  api<boolean>(`/User/delete-search-history?id=${id}`, { method: "DELETE" });

export const clearUserHistories = () =>
  api<boolean>("/User/delete-user-search-histories", { method: "DELETE" });

export const clearTextHistories = () =>
  api<boolean>("/User/delete-search-histories", { method: "DELETE" });