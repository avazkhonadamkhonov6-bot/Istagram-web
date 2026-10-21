import { Module } from '@nestjs/common';
import { FollowsModule } from '../follows/follows.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RelationsModule } from '../relations/relations.module';
import { CollectionsService } from './collections.service';
import { HashtagController } from './hashtag.controller';
import { CollectionController, PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [FollowsModule, NotificationsModule, RelationsModule],
  controllers: [PostsController, HashtagController, CollectionController],
  providers: [PostsService, CollectionsService],
  exports: [PostsService],
})
export class PostsModule {}
