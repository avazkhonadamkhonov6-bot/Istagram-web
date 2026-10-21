import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AddNoteDto, ErrorCode, NOTE_TTL_MS, NoteDto } from '@repo/shared';
import { notFound } from '../../common/app-exception';
import { userShortSelect } from '../../common/mappers';
import { PrismaService } from '../../infra/prisma.service';
import { RelationsService } from '../relations/relations.service';

const noteInclude = { user: { select: userShortSelect } } satisfies Prisma.NoteInclude;
type NoteRow = Prisma.NoteGetPayload<{ include: typeof noteInclude }>;

/**
 * Notes (Spec 15 §5): matni to 60 alomat baroi Direct, 24 soat.
 * Note-i user-ro faqat followerhoe mebinand, ki u onhoro follow kardaast (mutual);
 * note-i "Close friends" — faqat close friends-i muallif.
 */
@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly relations: RelationsService,
  ) {}

  private toDto(n: NoteRow): NoteDto {
    return {
      id: n.id,
      userId: n.userId,
      userName: n.user.userName,
      userImage: n.user.avatar,
      text: n.text,
      closeFriends: n.closeFriends,
      createdAt: n.createdAt.toISOString(),
      expiresAt: n.expiresAt.toISOString(),
    };
  }

  /** Note-i nav joi note-i kuhnaro megirad */
  async add(me: string, dto: AddNoteDto): Promise<NoteDto> {
    const now = new Date();
    const data = { text: dto.text, closeFriends: dto.closeFriends, createdAt: now, expiresAt: new Date(now.getTime() + NOTE_TTL_MS) };
    const row = await this.prisma.note.upsert({ where: { userId: me }, create: { userId: me, ...data }, update: data, include: noteInclude });
    return this.toDto(row);
  }

  async remove(me: string) {
    const { count } = await this.prisma.note.deleteMany({ where: { userId: me } });
    if (count === 0) throw notFound(ErrorCode.NOTE_NOT_FOUND);
    return true;
  }

  /** Note-i man avval, ba'd note-hoi digaron (nav → kuhna) */
  async list(me: string): Promise<NoteDto[]> {
    const blocked = await this.relations.blockedIds(me);
    const rows = await this.prisma.note.findMany({
      where: {
        expiresAt: { gt: new Date() },
        OR: [
          { userId: me },
          {
            userId: { notIn: blocked },
            // muallif maro follow mekunad va man uro
            user: { following: { some: { followingId: me } }, followers: { some: { followerId: me } } },
            OR: [{ closeFriends: false }, { user: { relations: { some: { targetId: me, type: 'CLOSE_FRIEND' } } } }],
          },
        ],
      },
      include: noteInclude,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const mine = rows.filter((r) => r.userId === me);
    return [...mine, ...rows.filter((r) => r.userId !== me)].map((r) => this.toDto(r));
  }
}
