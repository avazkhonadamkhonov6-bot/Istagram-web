import { Body, Controller, Delete, Get, Post, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  AddCommentDto,
  MEDIA_RULES,
  addCommentSchema,
  addPostBodySchema,
  addPostFavoriteSchema,
  commentIdQuerySchema,
  getCommentsQuerySchema,
  followingPostsQuerySchema,
  getPostsQuerySchema,
  intIdQuerySchema,
  paginationQuerySchema,
  postIdQuerySchema,
} from '@repo/shared';
import type { z } from 'zod';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok, paged } from '../../common/response';
import { uploadLimits } from '../../common/upload';
import { PostsService } from './posts.service';

type PostIdQuery = z.infer<typeof postIdQuerySchema>;

@ApiTags('Post')
@Controller('Post')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get('get-posts')
  async getPosts(@CurrentUser() me: AuthUser, @Query(new ZodPipe(getPostsQuerySchema)) q: z.infer<typeof getPostsQuerySchema>) {
    const { items, total } = await this.posts.getPosts(me.id, q);
    return paged(items, total, q);
  }

  @Get('get-reels')
  async getReels(@CurrentUser() me: AuthUser, @Query(new ZodPipe(paginationQuerySchema)) q: z.infer<typeof paginationQuerySchema>) {
    const { items, total } = await this.posts.getReels(me.id, q);
    return paged(items, total, q);
  }

  /** Spec 13 §2 */
  @Get('get-explore-posts')
  async getExplore(@CurrentUser() me: AuthUser, @Query(new ZodPipe(paginationQuerySchema)) q: z.infer<typeof paginationQuerySchema>) {
    const { items, total } = await this.posts.getExplore(me.id, q);
    return paged(items, total, q);
  }

  /** Spec 13 §3 */
  @Get('get-comments')
  async getComments(@Query(new ZodPipe(getCommentsQuerySchema)) q: z.infer<typeof getCommentsQuerySchema>) {
    const { items, total } = await this.posts.getComments(q.postId, q);
    return paged(items, total, q);
  }

  @Get('get-comment-replies')
  async getReplies(@Query(new ZodPipe(commentIdQuerySchema)) q: z.infer<typeof commentIdQuerySchema>) {
    return ok(await this.posts.getReplies(q.commentId));
  }

  @Get('get-post-by-id')
  async getById(@CurrentUser() me: AuthUser, @Query(new ZodPipe(intIdQuerySchema)) q: { id: number }) {
    return ok(await this.posts.getById(me.id, q.id));
  }

  @Get('get-my-posts')
  async getMine(@CurrentUser() me: AuthUser) {
    return ok(await this.posts.getMine(me.id));
  }

  @Get('get-following-post')
  async getFollowing(
    @CurrentUser() me: AuthUser,
    @Query(new ZodPipe(followingPostsQuerySchema)) q: z.infer<typeof followingPostsQuerySchema>,
  ) {
    const { items, total } = await this.posts.getFollowing(me.id, q);
    return paged(items, total, q);
  }

  @Post('add-post')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('Images', MEDIA_RULES.maxPostFiles, { limits: uploadLimits }))
  async addPost(
    @CurrentUser() me: AuthUser,
    @Body(new ZodPipe(addPostBodySchema)) body: z.infer<typeof addPostBodySchema>,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return ok(await this.posts.addPost(me.id, body, files));
  }

  @Delete('delete-post')
  async deletePost(@CurrentUser() me: AuthUser, @Query(new ZodPipe(intIdQuerySchema)) q: { id: number }) {
    return ok(await this.posts.deletePost(me.id, q.id));
  }

  @Post('like-post')
  async like(@CurrentUser() me: AuthUser, @Query(new ZodPipe(postIdQuerySchema)) q: PostIdQuery) {
    return ok(await this.posts.toggleLike(me.id, q.postId));
  }

  @Post('view-post')
  async view(@CurrentUser() me: AuthUser, @Query(new ZodPipe(postIdQuerySchema)) q: PostIdQuery) {
    return ok(await this.posts.view(me.id, q.postId));
  }

  @Post('add-comment')
  async addComment(@CurrentUser() me: AuthUser, @Body(new ZodPipe(addCommentSchema)) dto: AddCommentDto) {
    return ok(await this.posts.addComment(me.id, dto.postId, dto.comment, dto.parentId));
  }

  @Delete('delete-comment')
  async deleteComment(@CurrentUser() me: AuthUser, @Query(new ZodPipe(commentIdQuerySchema)) q: z.infer<typeof commentIdQuerySchema>) {
    return ok(await this.posts.deleteComment(me.id, q.commentId));
  }

  @Post('add-post-favorite')
  async favorite(@CurrentUser() me: AuthUser, @Body(new ZodPipe(addPostFavoriteSchema)) dto: z.infer<typeof addPostFavoriteSchema>) {
    return ok(await this.posts.toggleFavorite(me.id, dto.postId));
  }
}
