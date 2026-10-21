import { z } from 'zod';

/** Notes (Spec 15 §5): matni kutoh dar Direct, 24 soat, yak note baroi har user */
export const NOTE_TTL_MS = 24 * 3600_000;

export const addNoteSchema = z
  .object({ text: z.string().trim().min(1).max(60), closeFriends: z.boolean().default(false) })
  .strict();
export type AddNoteDto = z.infer<typeof addNoteSchema>;

export const noteDtoSchema = z.object({
  id: z.number().int(),
  userId: z.string(),
  userName: z.string(),
  userImage: z.string().nullable(),
  text: z.string(),
  closeFriends: z.boolean(),
  createdAt: z.string(),
  expiresAt: z.string(),
});
export type NoteDto = z.infer<typeof noteDtoSchema>;
