import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode, INSTANT_ARCHIVE_MS, INSTANT_TTL_MS, InstantDto } from '@repo/shared';
import { badRequest, notFound } from '../../common/app-exception';
import { userShortSelect } from '../../common/mappers';
import { PrismaService } from '../../infra/prisma.service';
import { StorageService } from '../../infra/storage.service';
import { RelationsService } from '../relations/relations.service';

const instantInclude = {
  user: { select: userShortSelect },
  _count: { select: { views: true } },
} satisfies Prisma.InstantInclude;
type InstantRow = Prisma.InstantGetPayload<{ include: typeof instantInclude }>;

/**
 * Instants (Spec 17): aksi momentali az kamera.
 * Giranda — followerhoe, ki muallif onhoro follow kardaast (mutual) yo faqat close friends.
 * Har giranda yak bor mebinad; 24 soat ba'd baroi hama nopadid; muallif dar archive 1 sol mebinad.
 */
@Injectable()
export class InstantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly relations: RelationsService,
  ) {}

  private toDto(i: InstantRow, me: string): InstantDto {
    return {
      id: i.id,
      userId: i.userId,
      userName: i.user.userName,
      userImage: i.user.avatar,
      fileName: i.fileName,
      closeFriends: i.closeFriends,
      createdAt: i.createdAt.toISOString(),
      expiresAt: i.expiresAt.toISOString(),
      viewCount: i.userId === me ? i._count.views : null,
    };
  }

  /** Faqat aks (video ne) — Instant tahrir va galereya nadorad */
  async add(me: string, file: Express.Multer.File | undefined, closeFriends: boolean): Promise<InstantDto> {
    if (!file) throw badRequest(ErrorCode.MEDIA_REQUIRED);
    const fileName = await this.storage.save(file, 'image');
    const now = new Date();
    const row = await this.prisma.instant.create({
      data: { userId: me, fileName, closeFriends, createdAt: now, expiresAt: new Date(now.getTime() + INSTANT_TTL_MS) },
      include: instantInclude,
    });
    return this.toDto(row, me);
  }

  /** Instant-hoi nadida az digaron (kuhna → nav, misli tudai aksho) */
  async inbox(me: string): Promise<InstantDto[]> {
    const blocked = await this.relations.blockedIds(me);
    const rows = await this.prisma.instant.findMany({
      where: {
        expiresAt: { gt: new Date() },
        userId: { not: me, notIn: blocked },
        views: { none: { userId: me } },
        // muallif maro follow mekunad va man uro
        user: { following: { some: { followingId: me } }, followers: { some: { followerId: me } } },
        OR: [{ closeFriends: false }, { user: { relations: { some: { targetId: me, type: 'CLOSE_FRIEND' } } } }],
      },
      include: instantInclude,
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    return rows.map((r) => this.toDto(r, me));
  }

  /** Instant-hoi man (nav → kuhna), to 1 sol — archive */
  async archive(me: string): Promise<InstantDto[]> {
    const rows = await this.prisma.instant.findMany({
      where: { userId: me, createdAt: { gt: new Date(Date.now() - INSTANT_ARCHIVE_MS) } },
      include: instantInclude,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => this.toDto(r, me));
  }

  /** Giranda did — digar dar inbox-i u namoyon nameshavad */
  async view(me: string, id: number) {
    const instant = await this.prisma.instant.findUnique({ where: { id }, select: { userId: true } });
    if (!instant) throw notFound(ErrorCode.INSTANT_NOT_FOUND);
    if (instant.userId === me) return true;
    await this.prisma.instantView.upsert({
      where: { instantId_userId: { instantId: id, userId: me } },
      create: { instantId: id, userId: me },
      update: {},
    });
    return true;
  }

  /** "Undo" — muallif instant-ro baroi hama hazf mekunad */
  async remove(me: string, id: number) {
    const instant = await this.prisma.instant.findFirst({ where: { id, userId: me } });
    if (!instant) throw notFound(ErrorCode.INSTANT_NOT_FOUND);
    await this.prisma.instant.delete({ where: { id } });
    this.storage.remove(instant.fileName);
    return true;
  }
}
