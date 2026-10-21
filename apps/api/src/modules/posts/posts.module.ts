import { Module } from '@nestjs/common';
import { FollowsModule } from '../follows/follows.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { HashtagController } from './hashtag.controller';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [FollowsModule, NotificationsModule],
  controllers: [PostsController, HashtagController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
