import { z } from 'zod';
import { userShortSchema } from './common';

/** Spec 13 §1 */
export const NOTIFICATION_TYPES = [
  'LIKE',
  'COMMENT',
  'COMMENT_REPLY',
  'FOLLOW',
  // Spec 14 §5
  'FOLLOW_REQUEST',
  'FOLLOW_ACCEPTED',
  'COMMENT_LIKE',
  'MENTION',
  'TAG',
] as const;

export const notificationDtoSchema = z.object({
  id: z.number().int(),
  type: z.enum(NOTIFICATION_TYPES),
  actor: userShortSchema.extend({ isFollowing: z.boolean() }),
  post: z.object({ postId: z.number().int(), image: z.string().nullable() }).nullable(),
  commentText: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.string(),
});
export type NotificationDto = z.infer<typeof notificationDtoSchema>;

export const countSchema = z.object({ count: z.number().int() });
