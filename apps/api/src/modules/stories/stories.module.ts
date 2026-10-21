import { Module } from '@nestjs/common';
import { FollowsModule } from '../follows/follows.module';
import { PostsModule } from '../posts/posts.module';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  imports: [FollowsModule, PostsModule],
  controllers: [StoriesController],
  providers: [StoriesService],
})
export class StoriesModule {}
