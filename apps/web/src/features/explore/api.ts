import { postDtoSchema, type HashtagDto, type PostDto } from "@repo/shared";
import { searchHashtags } from "@/features/search/api";
import { api } from "@/lib/api-client";

export const EXPLORE_PAGE_SIZE = 24;

export const getExplorePosts = (page: number) =>
  api<PostDto[]>(
    `/Post/get-explore-posts?PageNumber=${page}&PageSize=${EXPLORE_PAGE_SIZE}`,
    { schema: postDtoSchema.array() },
  );

export const getTagPosts = (tag: string, page: number) =>
  api<PostDto[]>(
    `/Hashtag/get-posts?Name=${encodeURIComponent(tag)}&PageNumber=${page}&PageSize=${EXPLORE_PAGE_SIZE}`,
    { schema: postDtoSchema.array() },
  );

export async function getTagInfo(tag: string): Promise<HashtagDto | null> {
  const list = await searchHashtags(tag);
  return list.find((h) => h.name.toLowerCase() === tag.toLowerCase()) ?? null;
}