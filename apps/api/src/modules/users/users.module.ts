import { Module } from '@nestjs/common';
import { FollowsModule } from '../follows/follows.module';
import { PostsModule } from '../posts/posts.module';
import { RelationsModule } from '../relations/relations.module';
import { UserProfileController } from './user-profile.controller';
import { UserController } from './user.controller';
import { UsersService } from './users.service';

@Module({
  imports: [FollowsModule, PostsModule, RelationsModule],
  controllers: [UserController, UserProfileController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
