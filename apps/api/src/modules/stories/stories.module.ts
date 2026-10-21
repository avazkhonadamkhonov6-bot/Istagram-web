import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { FollowsModule } from '../follows/follows.module';
import { PostsModule } from '../posts/posts.module';
import { RelationsModule } from '../relations/relations.module';
import { HighlightController, StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  imports: [FollowsModule, PostsModule, RelationsModule, ChatModule],
  controllers: [StoriesController, HighlightController],
  providers: [StoriesService],
})
export class StoriesModule {}
