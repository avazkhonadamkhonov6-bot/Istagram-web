/** Additional clients used by highlights and collections. */
import { userStoriesSchema } from "@repo/shared";
import { api } from "@/lib/api-client";
const json = (body: unknown) => ({
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
export const getMyStories = () =>
  api("/Story/get-my-stories", { schema: userStoriesSchema });
export const renameCollection = (id: number, name: string) =>
  api<boolean>("/Collection/update-collection", {
    method: "PUT",
    ...json({ id, name }),
  });
export const removeFromCollection = (collectionId: number, postId: number) =>
  api<boolean>(
    `/Collection/remove-from-collection?collectionId=${collectionId}&postId=${postId}`,
    { method: "DELETE" },
  );
export const updateHighlight = (
  id: number,
  title: string,
  storyIds: number[],
) =>
  api<boolean>("/Highlight/update-highlight", {
    method: "PUT",
    ...json({ id, title, storyIds }),
  });
