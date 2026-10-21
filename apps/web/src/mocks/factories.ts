import { faker } from "@faker-js/faker";
import {
  commentDtoSchema,
  notificationDtoSchema,
  postDtoSchema,
  userListItemSchema,
  userProfileSchema,
  userStoriesSchema,
  type CommentDto,
  type NotificationDto,
  type PostDto,
  type UserListItem,
  type UserProfile,
  type UserStories,
} from "@repo/shared";

faker.seed(42);

function fakeHandle(fallback: string): string {
  const raw = `${faker.person.firstName()}.${faker.number.int({ min: 10, max: 99 })}`
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "");
  return raw.slice(0, 20) || fallback;
}

export function createMockUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  const userName = overrides.userName ?? fakeHandle("ali");
  return userProfileSchema.parse({
    userId: faker.string.uuid(),
    userName,
    fullName: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    about: faker.lorem.sentence({ min: 3, max: 8 }).slice(0, 140),
    gender: 1,
    image: null,
    postCount: faker.number.int({ min: 1, max: 30 }),
    subscribersCount: faker.number.int({ min: 10, max: 500 }),
    subscriptionsCount: faker.number.int({ min: 10, max: 300 }),
    dateUpdated: new Date().toISOString(),
    ...overrides,
  });
}

export function createMockUserListItem(overrides: Partial<UserListItem> = {}): UserListItem {
  const profile = createMockUserProfile({
    userId: overrides.id,
    userName: overrides.userName,
    fullName: overrides.fullName ?? undefined,
    email: overrides.email,
  });
  return userListItemSchema.parse({
    id: profile.userId,
    userName: profile.userName,
    fullName: profile.fullName,
    email: profile.email,
    avatar: profile.image,
    subscribersCount: profile.subscribersCount,
    ...overrides,
  });
}

export function createMockComment(postId: number, overrides: Partial<CommentDto> = {}): CommentDto {
  return commentDtoSchema.parse({
    postCommentId: faker.number.int({ min: 1, max: 100_000 }),
    postId,
    userId: faker.string.uuid(),
    userName: fakeHandle("user1"),
    userImage: null,
    comment: faker.lorem.sentence({ min: 2, max: 10 }),
    dateCommented: faker.date.recent({ days: 5 }).toISOString(),
    parentId: null,
    replyCount: 0,
    ...overrides,
  });
}

export function createMockPost(overrides: Partial<PostDto> = {}): PostDto {
  const postId = overrides.postId ?? faker.number.int({ min: 1, max: 100_000 });
  const comments = overrides.comments ?? [createMockComment(postId)];
  return postDtoSchema.parse({
    postId,
    userId: faker.string.uuid(),
    userName: fakeHandle("pamir.travel"),
    userImage: null,
    title: faker.location.city(),
    content: `${faker.lorem.sentence()} #tajikistan #pamir`,
    images: ["mock-1.jpg"],
    isReel: false,
    datePublished: faker.date.recent({ days: 7 }).toISOString(),
    postLike: false,
    postLikeCount: faker.number.int({ min: 0, max: 900 }),
    postView: faker.number.int({ min: 10, max: 5000 }),
    commentCount: comments.length,
    postFavorite: false,
    comments,
    userLikes: [],
    ...overrides,
  });
}

export function createMockStories(overrides: Partial<UserStories> = {}): UserStories {
  const userId = overrides.userId ?? faker.string.uuid();
  const userName = overrides.userName ?? "ali";
  return userStoriesSchema.parse({
    userId,
    userName,
    userImage: null,
    hasUnseen: true,
    stories: [
      {
        id: faker.number.int({ min: 1, max: 10_000 }),
        fileName: "mock-story.jpg",
        postId: null,
        createAt: new Date().toISOString(),
        userId,
        userAvatar: null,
        liked: false,
        viewed: false,
        viewerDto: {
          userName,
          name: userName,
          viewCount: 3,
          viewLike: 1,
        },
      },
    ],
    ...overrides,
  });
}

export function createMockNotification(overrides: Partial<NotificationDto> = {}): NotificationDto {
  return notificationDtoSchema.parse({
    id: faker.number.int({ min: 1, max: 100_000 }),
    type: "LIKE",
    actor: {
      id: faker.string.uuid(),
      userName: "ali",
      fullName: "Ali Valiev",
      avatar: null,
      isFollowing: false,
    },
    post: { postId: 1, image: "mock-1.jpg" },
    commentText: null,
    isRead: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  });
}