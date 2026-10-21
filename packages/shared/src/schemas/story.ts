import { z } from 'zod';

export const addStoryQuerySchema = z.object({
  PostId: z.coerce.number().int().positive().optional(),
  /** Spec 14 §3 */
  CloseFriends: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
});
export const replyStorySchema = z.object({ storyId: z.number().int().positive(), text: z.string().trim().min(1).max(1000) }).strict();

/** Highlights (Spec 14 §3) */
export const highlightDtoSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  cover: z.string().nullable(),
  storiesCount: z.number().int(),
});
export type HighlightDto = z.infer<typeof highlightDtoSchema>;
export const highlightsQuerySchema = z.object({ UserId: z.string().uuid() });
export const addHighlightSchema = z
  .object({ title: z.string().trim().min(1).max(30), storyIds: z.array(z.number().int().positive()).min(1).max(100) })
  .strict();
export const updateHighlightSchema = z
  .object({
    id: z.number().int().positive(),
    title: z.string().trim().min(1).max(30).optional(),
    storyIds: z.array(z.number().int().positive()).min(1).max(100).optional(),
  })
  .strict();
export const storyIdQuerySchema = z.object({ storyId: z.coerce.number().int().positive() });
export const storyViewQuerySchema = z.object({ StoryId: z.coerce.number().int().positive() });

export const viewerDtoSchema = z.object({
  userName: z.string().nullable(),
  name: z.string().nullable(),
  viewCount: z.number().int().nullable(),
  viewLike: z.number().int().nullable(),
});

export const getStoryDtoSchema = z.object({
  id: z.number().int(),
  fileName: z.string().nullable(),
  postId: z.number().int().nullable(),
  createAt: z.string(),
  userId: z.string(),
  userAvatar: z.string().nullable(),
  liked: z.boolean(),
  viewed: z.boolean(),
  viewerDto: viewerDtoSchema,
  /** Spec 14 §3 */
  closeFriends: z.boolean().default(false),
  userName: z.string().default(''),
  expiresAt: z.string().default(''),
});
export type GetStoryDto = z.infer<typeof getStoryDtoSchema>;

export const getStoryViewDtoSchema = z.object({
  id: z.number().int(),
  viewUserId: z.string(),
  storyId: z.number().int(),
});
export type GetStoryViewDto = z.infer<typeof getStoryViewDtoSchema>;

export const userStoriesSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userImage: z.string().nullable(),
  hasUnseen: z.boolean(),
  stories: z.array(getStoryDtoSchema),
  /** Agar story-i close friends dar mobayn boshad — halqai sabz */
  hasCloseFriends: z.boolean().default(false),
});
export type UserStories = z.infer<typeof userStoriesSchema>;

export const STORY_TTL_MS = 24 * 60 * 60 * 1000;
