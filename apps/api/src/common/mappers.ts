import type { UserShort } from '@repo/shared';

/** Maydonhoi user baroi `select` dar Prisma — hech vaqt passwordHash (Spec 01 AC8). */
export const userShortSelect = { id: true, userName: true, fullName: true, avatar: true } as const;

export function toUserShort(u: { id: string; userName: string; fullName: string | null; avatar: string | null }): UserShort {
  return { id: u.id, userName: u.userName, fullName: u.fullName, avatar: u.avatar };
}
