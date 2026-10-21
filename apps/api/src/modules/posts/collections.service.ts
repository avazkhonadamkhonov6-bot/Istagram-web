import { Injectable } from '@nestjs/common';
import { CollectionDto, ErrorCode, PaginationQuery } from '@repo/shared';
import { notFound } from '../../common/app-exception';
import { PrismaService } from '../../infra/prisma.service';
import { PostsService } from './posts.service';

/** Collections-i Saved (Spec 14 §2) — faqat baroi xud */
@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly posts: PostsService,
  ) {}

  private async assertOwn(me: string, id: number) {
    const c = await this.prisma.collection.findFirst({ where: { id, userId: me }, select: { id: true } });
    if (!c) throw notFound(ErrorCode.COLLECTION_NOT_FOUND);
  }

  async list(me: string): Promise<CollectionDto[]> {
    const rows = await this.prisma.collection.findMany({
      where: { userId: me },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        _count: { select: { items: true } },
        items: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { post: { select: { images: { orderBy: { order: 'asc' }, take: 1, select: { fileName: true } } } } },
        },
      },
    });
    return rows.map((c) => ({ id: c.id, name: c.name, postsCount: c._count.items, cover: c.items[0]?.post.images[0]?.fileName ?? null }));
  }

  async add(me: string, name: string): Promise<CollectionDto> {
    const c = await this.prisma.collection.create({ data: { userId: me, name } });
    return { id: c.id, name: c.name, postsCount: 0, cover: null };
  }

  async rename(me: string, id: number, name: string) {
    await this.assertOwn(me, id);
    await this.prisma.collection.update({ where: { id }, data: { name } });
    return true;
  }

  async remove(me: string, id: number) {
    await this.assertOwn(me, id);
    await this.prisma.collection.delete({ where: { id } });
    return true;
  }

  /** Post ba collection → xudkor saved ham */
  async addItem(me: string, collectionId: number, postId: number) {
    await this.assertOwn(me, collectionId);
    await this.posts.assertExists(postId);
    await this.prisma.$transaction([
      this.prisma.postFavorite.createMany({ data: [{ userId: me, postId }], skipDuplicates: true }),
      this.prisma.collectionItem.createMany({ data: [{ collectionId, postId }], skipDuplicates: true }),
    ]);
    return true;
  }

  async removeItem(me: string, collectionId: number, postId: number) {
    await this.assertOwn(me, collectionId);
    await this.prisma.collectionItem.deleteMany({ where: { collectionId, postId } });
    return true;
  }

  async postsOf(me: string, collectionId: number, q: PaginationQuery) {
    await this.assertOwn(me, collectionId);
    return this.posts.getCollectionPosts(me, collectionId, q);
  }
}
