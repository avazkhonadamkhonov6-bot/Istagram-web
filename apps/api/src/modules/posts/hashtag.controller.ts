import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { hashtagPostsQuerySchema, hashtagSearchQuerySchema } from '@repo/shared';
import type { z } from 'zod';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok, paged } from '../../common/response';
import { PostsService } from './posts.service';

/** Spec 13 §2 */
@ApiTags('Hashtag')
@Controller('Hashtag')
export class HashtagController {
  constructor(private readonly posts: PostsService) {}

  @Get('search')
  async search(@Query(new ZodPipe(hashtagSearchQuerySchema)) q: z.infer<typeof hashtagSearchQuerySchema>) {
    return ok(await this.posts.searchHashtags(q.Query));
  }

  @Get('get-posts')
  async getPosts(@CurrentUser() me: AuthUser, @Query(new ZodPipe(hashtagPostsQuerySchema)) q: z.infer<typeof hashtagPostsQuerySchema>) {
    const { items, total } = await this.posts.getHashtagPosts(me.id, q.Name, q);
    return paged(items, total, q);
  }
}
