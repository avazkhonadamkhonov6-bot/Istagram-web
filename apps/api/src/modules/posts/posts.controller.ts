import { Body, Controller, Delete, Get, Post, Put, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  AddCommentDto,
  MEDIA_RULES,
  UpdatePostDto,
  addCollectionSchema,
  addCommentSchema,
  addPostBodySchema,
  addPostFavoriteSchema,
  collectionItemQuerySchema,
  collectionItemSchema,
  collectionPostsQuerySchema,
  commentIdQuerySchema,
  getCommentsQuerySchema,
  followingPostsQuerySchema,
  getPostsQuerySchema,
  intIdQuerySchema,
  locationPostsQuerySchema,
  paginationQuerySchema,
  postIdQuerySchema,
  updateCollectionSchema,
  updatePostSchema,
  userPostsQuerySchema,
} from '@repo/shared';
import type { z } from 'zod';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok, paged } from '../../common/response';
import { uploadLimits } from '../../common/upload';
import { CollectionsService } from './collections.service';
import { PostsService } from './posts.service';

type PostIdQuery = z.infer<typeof postIdQuerySchema>;
type PageQuery = z.infer<typeof paginationQuerySchema>;

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
  async getReels(@CurrentUser() me: AuthUser, @Query(new ZodPipe(paginationQuerySchema)) q: PageQuery) {
    const { items, total } = await this.posts.getReels(me.id, q);
    return paged(items, total, q);
  }

  /** Spec 13 §2 */
  @Get('get-explore-posts')
  async getExplore(@CurrentUser() me: AuthUser, @Query(new ZodPipe(paginationQuerySchema)) q: PageQuery) {
    const { items, total } = await this.posts.getExplore(me.id, q);
    return paged(items, total, q);
  }

  /** Spec 13 §3 */
  @Get('get-comments')
  async getComments(@CurrentUser() me: AuthUser, @Query(new ZodPipe(getCommentsQuerySchema)) q: z.infer<typeof getCommentsQuerySchema>) {
    const { items, total } = await this.posts.getComments(me.id, q.postId, q);
    return paged(items, total, q);
  }

  @Get('get-comment-replies')
  async getReplies(@CurrentUser() me: AuthUser, @Query(new ZodPipe(commentIdQuerySchema)) q: z.infer<typeof commentIdQuerySchema>) {
    return ok(await this.posts.getReplies(me.id, q.commentId));
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

  /** Spec 14 §2 */
  @Get('get-tagged-posts')
  async getTagged(@CurrentUser() me: AuthUser, @Query(new ZodPipe(userPostsQuerySchema)) q: z.infer<typeof userPostsQuerySchema>) {
    const { items, total } = await this.posts.getTagged(me.id, q.UserId, q);
    return paged(items, total, q);
  }

  @Get('get-location-posts')
  async getLocation(@CurrentUser() me: AuthUser, @Query(new ZodPipe(locationPostsQuerySchema)) q: z.infer<typeof locationPostsQuerySchema>) {
    const { items, total } = await this.posts.getLocationPosts(me.id, q.Name, q);
    return paged(items, total, q);
  }

  /** Spec 15 §1: feed-i Favorites */
  @Get('get-favorites-feed')
  async getFavoritesFeed(@CurrentUser() me: AuthUser, @Query(new ZodPipe(paginationQuerySchema)) q: PageQuery) {
    const { items, total } = await this.posts.getFavoritesFeed(me.id, q);
    return paged(items, total, q);
  }

  /** Spec 15 §6: "Your activity → Likes" */
  @Get('get-liked-posts')
  async getLiked(@CurrentUser() me: AuthUser, @Query(new ZodPipe(paginationQuerySchema)) q: PageQuery) {
    const { items, total } = await this.posts.getLiked(me.id, q);
    return paged(items, total, q);
  }

  /** Spec 15 §2: tab-i REELS dar profil */
  @Get('get-user-reels')
  async getUserReels(@CurrentUser() me: AuthUser, @Query(new ZodPipe(userPostsQuerySchema)) q: z.infer<typeof userPostsQuerySchema>) {
    const { items, total } = await this.posts.getUserReels(me.id, q.UserId, q);
    return paged(items, total, q);
  }

  @Get('get-archived-posts')
  async getArchived(@CurrentUser() me: AuthUser, @Query(new ZodPipe(paginationQuerySchema)) q: PageQuery) {
    const { items, total } = await this.posts.getArchived(me.id, q);
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

  @Put('update-post')
  async updatePost(@CurrentUser() me: AuthUser, @Body(new ZodPipe(updatePostSchema)) dto: UpdatePostDto) {
    return ok(await this.posts.updatePost(me.id, dto));
  }

  @Post('archive-post')
  async archive(@CurrentUser() me: AuthUser, @Query(new ZodPipe(postIdQuerySchema)) q: PostIdQuery) {
    return ok(await this.posts.toggleArchive(me.id, q.postId));
  }

  @Post('pin-post')
  async pin(@CurrentUser() me: AuthUser, @Query(new ZodPipe(postIdQuerySchema)) q: PostIdQuery) {
    return ok(await this.posts.togglePin(me.id, q.postId));
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

  @Post('like-comment')
  async likeComment(@CurrentUser() me: AuthUser, @Query(new ZodPipe(commentIdQuerySchema)) q: z.infer<typeof commentIdQuerySchema>) {
    return ok(await this.posts.toggleCommentLike(me.id, q.commentId));
  }

  /** Spec 15 §2 */
  @Post('pin-comment')
  async pinComment(@CurrentUser() me: AuthUser, @Query(new ZodPipe(commentIdQuerySchema)) q: z.infer<typeof commentIdQuerySchema>) {
    return ok(await this.posts.toggleCommentPin(me.id, q.commentId));
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

/** Spec 14 §2 */
@ApiTags('Collection')
@Controller('Collection')
export class CollectionController {
  constructor(private readonly collections: CollectionsService) {}

  @Get('get-collections')
  async list(@CurrentUser() me: AuthUser) {
    return ok(await this.collections.list(me.id));
  }

  @Post('add-collection')
  async add(@CurrentUser() me: AuthUser, @Body(new ZodPipe(addCollectionSchema)) dto: z.infer<typeof addCollectionSchema>) {
    return ok(await this.collections.add(me.id, dto.name));
  }

  @Put('update-collection')
  async update(@CurrentUser() me: AuthUser, @Body(new ZodPipe(updateCollectionSchema)) dto: z.infer<typeof updateCollectionSchema>) {
    return ok(await this.collections.rename(me.id, dto.id, dto.name));
  }

  @Delete('delete-collection')
  async remove(@CurrentUser() me: AuthUser, @Query(new ZodPipe(intIdQuerySchema)) q: { id: number }) {
    return ok(await this.collections.remove(me.id, q.id));
  }

  @Post('add-to-collection')
  async addItem(@CurrentUser() me: AuthUser, @Body(new ZodPipe(collectionItemSchema)) dto: z.infer<typeof collectionItemSchema>) {
    return ok(await this.collections.addItem(me.id, dto.collectionId, dto.postId));
  }

  @Delete('remove-from-collection')
  async removeItem(@CurrentUser() me: AuthUser, @Query(new ZodPipe(collectionItemQuerySchema)) q: z.infer<typeof collectionItemQuerySchema>) {
    return ok(await this.collections.removeItem(me.id, q.collectionId, q.postId));
  }

  @Get('get-collection-posts')
  async posts(@CurrentUser() me: AuthUser, @Query(new ZodPipe(collectionPostsQuerySchema)) q: z.infer<typeof collectionPostsQuerySchema>) {
    const { items, total } = await this.collections.postsOf(me.id, q.collectionId, q);
    return paged(items, total, q);
  }
}
