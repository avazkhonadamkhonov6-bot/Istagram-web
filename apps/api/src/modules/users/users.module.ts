import { Module } from '@nestjs/common';
import { FollowsModule } from '../follows/follows.module';
import { PostsModule } from '../posts/posts.module';
import { UserProfileController } from './user-profile.controller';
import { UserController } from './user.controller';
import { UsersService } from './users.service';

@Module({
  imports: [FollowsModule, PostsModule],
  controllers: [UserController, UserProfileController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
