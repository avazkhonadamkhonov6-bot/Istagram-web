import { z } from 'zod';

export const addStoryQuerySchema = z.object({ PostId: z.coerce.number().int().positive().optional() });
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
});
export type UserStories = z.infer<typeof userStoriesSchema>;

export const STORY_TTL_MS = 24 * 60 * 60 * 1000;
