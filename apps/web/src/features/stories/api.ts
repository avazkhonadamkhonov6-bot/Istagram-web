import { userStoriesSchema, type UserStories } from "@repo/shared";
import { api } from "@/lib/api-client";
export const storyKey = ["stories"] as const;
export const getStories = () =>
  api<UserStories[]>("/Story/get-stories", {
    schema: userStoriesSchema.array(),
  });
export const viewStory = (id: number) =>
  api(`/Story/add-story-view?StoryId=${id}`, { method: "POST" });
export const likeStory = (id: number) =>
  api(`/Story/LikeStory?storyId=${id}`, { method: "POST" });
