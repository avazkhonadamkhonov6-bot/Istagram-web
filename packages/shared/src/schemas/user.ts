import { z } from 'zod';
import { paginationQuerySchema, userShortSchema } from './common';

export const getUsersQuerySchema = paginationQuerySchema.extend({
  UserName: z.string().trim().max(30).optional(),
  Email: z.string().trim().max(254).optional(),
});

export const userListItemSchema = z.object({
  id: z.string(),
  userName: z.string(),
  fullName: z.string().nullable(),
  email: z.string(),
  avatar: z.string().nullable(),
  subscribersCount: z.number().int(),
});
export type UserListItem = z.infer<typeof userListItemSchema>;

export const addSearchHistoryQuerySchema = z.object({ Text: z.string().trim().min(1).max(100) });
export const addUserSearchHistoryQuerySchema = z.object({ UserSearchId: z.string().uuid() });
export const deleteUserQuerySchema = z.object({ userId: z.string().uuid() });

export const searchHistorySchema = z.object({
  id: z.number().int(),
  text: z.string(),
  createdAt: z.string(),
});
export type SearchHistory = z.infer<typeof searchHistorySchema>;

export const userSearchHistorySchema = z.object({
  id: z.number().int(),
  createdAt: z.string(),
  users: userShortSchema,
});
export type UserSearchHistory = z.infer<typeof userSearchHistorySchema>;

/** UserProfile (Spec 12 §4) */
export const genderSchema = z.union([z.literal(0), z.literal(1)]);

export const userProfileQuerySchema = z.object({ id: z.string().uuid() });
export const isFollowQuerySchema = z.object({ followingUserId: z.string().uuid() });

export const userProfileSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  fullName: z.string().nullable(),
  email: z.string(),
  about: z.string().nullable(),
  gender: genderSchema.nullable(),
  image: z.string().nullable(),
  postCount: z.number().int(),
  subscribersCount: z.number().int(),
  subscriptionsCount: z.number().int(),
  dateUpdated: z.string(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const updateUserProfileSchema = z
  .object({
    about: z.string().trim().max(150).nullable().optional(),
    gender: genderSchema.nullable().optional(),
  })
  .strict();
export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>;

/** FollowingRelationShip (Spec 12 §5) */
export const followQuerySchema = z.object({ followingUserId: z.string().uuid() });
export const followListQuerySchema = z.object({ UserId: z.string().uuid() });
export const followResultSchema = z.object({
  isFollowing: z.boolean(),
  subscribersCount: z.number().int(),
});
export type FollowResult = z.infer<typeof followResultSchema>;
