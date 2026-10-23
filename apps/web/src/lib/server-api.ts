import "server-only";
import { connection } from "next/server";
import {
  highlightDtoSchema,
  postDtoSchema,
  userListItemSchema,
  userProfileSchema,
} from "@repo/shared";
import { apiFetch, readToken } from "./bff";

// Auth stays in the existing server BFF. Only validated DTOs enter client props.
async function read(path: string): Promise<unknown> {
  const token = await readToken();
  if (!token) return undefined;
  const response = await apiFetch(path, { token });
  if (!response.ok) return undefined;
  return ((await response.json()) as { data: unknown }).data;
}
export async function getServerProfile(username: string) {
  if (process.env.NEXT_PUBLIC_API_MOCKING === "on") return undefined;
  await connection();
  try {
    const users = userListItemSchema
      .array()
      .parse(
        await read(
          `/User/get-users?UserName=${encodeURIComponent(username)}&PageSize=20`,
        ),
      );
    const user = users.find(
      (u) => u.userName.toLowerCase() === username.toLowerCase(),
    );
    if (!user) return undefined;
    return userProfileSchema.parse(
      await read(`/UserProfile/get-user-profile-by-id?id=${user.id}`),
    );
  } catch {
    return undefined;
  }
}
export async function getServerPost(id: number) {
  if (
    process.env.NEXT_PUBLIC_API_MOCKING === "on" ||
    !Number.isInteger(id) ||
    id < 1
  )
    return undefined;
  await connection();
  try {
    return postDtoSchema.parse(await read(`/Post/get-post-by-id?id=${id}`));
  } catch {
    return undefined;
  }
}

/** Server data keeps the profile layout stable before the first client query. */
export async function getServerProfileData(
  username: string,
  kind: "posts" | "reels" | "saved" | "tagged" = "posts",
) {
  const initialProfile = await getServerProfile(username);
  if (!initialProfile) return { initialProfile };
  try {
    const [me, highlights] = await Promise.all([
      read("/UserProfile/get-my-profile").then((value) =>
        userProfileSchema.parse(value),
      ),
      read(`/Highlight/get-highlights?UserId=${initialProfile.userId}`).then(
        (value) => highlightDtoSchema.array().parse(value),
      ),
    ]);
    const userQuery = `UserId=${initialProfile.userId}&PageNumber=1&PageSize=12`;
    const path =
      kind === "saved"
        ? "/UserProfile/get-post-favorites?PageNumber=1&PageSize=12"
        : kind === "reels"
          ? `/Post/get-user-reels?${userQuery}`
          : kind === "tagged"
            ? `/Post/get-tagged-posts?${userQuery}`
            : `/Post/get-posts?${userQuery}`;
    const posts =
      kind === "saved" && me.userId !== initialProfile.userId
        ? []
        : postDtoSchema.array().parse(await read(path));
    return {
      initialProfile,
      initialIsSelf: me.userId === initialProfile.userId,
      initialHighlights: highlights,
      initialPosts: posts,
    };
  } catch {
    return { initialProfile };
  }
}
