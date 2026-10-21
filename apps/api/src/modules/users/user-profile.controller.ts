import { Body, Controller, Delete, Get, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  ErrorCode,
  UpdateUserProfileDto,
  isFollowQuerySchema,
  paginationQuerySchema,
  updateUserProfileSchema,
  userProfileQuerySchema,
} from '@repo/shared';
import type { z } from 'zod';
import { badRequest } from '../../common/app-exception';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok, paged } from '../../common/response';
import { uploadLimits } from '../../common/upload';
import { FollowsService } from '../follows/follows.service';
import { PostsService } from '../posts/posts.service';
import { UsersService } from './users.service';

@ApiTags('UserProfile')
@Controller('UserProfile')
export class UserProfileController {
  constructor(
    private readonly users: UsersService,
    private readonly follows: FollowsService,
    private readonly posts: PostsService,
  ) {}

  @Get('get-user-profile-by-id')
  async getById(@Query(new ZodPipe(userProfileQuerySchema)) q: z.infer<typeof userProfileQuerySchema>) {
    return ok(await this.users.getProfile(q.id));
  }

  @Get('get-is-follow-user-profile-by-id')
  async isFollow(@CurrentUser() me: AuthUser, @Query(new ZodPipe(isFollowQuerySchema)) q: z.infer<typeof isFollowQuerySchema>) {
    return ok(await this.follows.isFollowing(me.id, q.followingUserId));
  }

  @Get('get-my-profile')
  async getMine(@CurrentUser() me: AuthUser) {
    return ok(await this.users.getProfile(me.id));
  }

  @Put('update-user-profile')
  async update(@CurrentUser() me: AuthUser, @Body(new ZodPipe(updateUserProfileSchema)) dto: UpdateUserProfileDto) {
    return ok(await this.users.updateProfile(me.id, dto));
  }

  @Get('get-post-favorites')
  async favorites(@CurrentUser() me: AuthUser, @Query(new ZodPipe(paginationQuerySchema)) q: z.infer<typeof paginationQuerySchema>) {
    const { items, total } = await this.posts.getFavorites(me.id, q);
    return paged(items, total, q);
  }

  @Put('update-user-image-profile')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('imageFile', { limits: uploadLimits }))
  async updateImage(@CurrentUser() me: AuthUser, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw badRequest(ErrorCode.MEDIA_REQUIRED);
    return ok(await this.users.updateAvatar(me.id, file));
  }

  @Delete('delete-user-image-profile')
  async deleteImage(@CurrentUser() me: AuthUser) {
    return ok(await this.users.deleteAvatar(me.id));
  }
}
