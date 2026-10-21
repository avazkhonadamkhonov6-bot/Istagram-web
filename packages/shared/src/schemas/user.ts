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
export const suggestionsQuerySchema = z.object({ Limit: z.coerce.number().int().min(1).max(30).default(5) });
export const suggestionSchema = userShortSchema.extend({ subscribersCount: z.number().int() });
export type Suggestion = z.infer<typeof suggestionSchema>;

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
  /** Spec 14 §1.1 */
  isPrivate: z.boolean().default(false),
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
  /** Darxost ba hisobi private (Spec 14 §1.1) */
  isRequested: z.boolean().default(false),
});
export type FollowResult = z.infer<typeof followResultSchema>;

/** Spec 14 §1 */
export const updatePrivacySchema = z.object({ isPrivate: z.boolean() }).strict();
export const userIdQuerySchema = z.object({ userId: z.string().uuid() });
export const muteQuerySchema = z.object({
  userId: z.string().uuid(),
  Posts: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  Stories: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
});
export const FOLLOW_STATUSES = ['none', 'requested', 'following'] as const;
export type FollowStatus = (typeof FOLLOW_STATUSES)[number];
/** Holati man nisbat ba user-i digar — baroi menyui profil */
export const relationStatusSchema = z.object({
  followStatus: z.enum(FOLLOW_STATUSES),
  followsMe: z.boolean(),
  isBlocked: z.boolean(),
  isMutedPosts: z.boolean(),
  isMutedStories: z.boolean(),
  isRestricted: z.boolean(),
  isCloseFriend: z.boolean(),
  /** Spec 15 §1 */
  isFavorite: z.boolean().default(false),
});
export type RelationStatus = z.infer<typeof relationStatusSchema>;

/** Favorites (Spec 15 §1): maks. 50 nafar */
export const FAVORITES_LIMIT = 50;

/** "Active now" / "Active 5m ago" (Spec 15 §4) */
export const activityStatusSchema = z.object({
  userId: z.string(),
  isOnline: z.boolean(),
  lastActiveAt: z.string().nullable(),
});
export type ActivityStatus = z.infer<typeof activityStatusSchema>;

export const REPORT_TARGETS = ['POST', 'COMMENT', 'USER', 'STORY', 'MESSAGE'] as const;
export const addReportSchema = z
  .object({
    targetType: z.enum(REPORT_TARGETS),
    targetId: z.string().trim().min(1).max(64),
    reason: z.string().trim().min(1).max(500),
  })
  .strict();
export type AddReportDto = z.infer<typeof addReportSchema>;
