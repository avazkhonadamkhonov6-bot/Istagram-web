import { Injectable } from "@nestjs/common";
import {
  ErrorCode,
  RESERVED_USERNAMES,
  Suggestion,
  UpdateUserProfileDto,
  UserListItem,
  UserProfile,
  UserSearchHistory,
} from "@repo/shared";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../../common/app-exception";
import { toUserShort, userShortSelect } from "../../common/mappers";
import { skipTake } from "../../common/response";
import { PrismaService, isUniqueViolation } from "../../infra/prisma.service";
import { StorageService } from "../../infra/storage.service";
import { FollowsService } from "../follows/follows.service";
import { RelationsService } from "../relations/relations.service";

const profileSelect = {
  id: true,
  userName: true,
  fullName: true,
  website: true,
  email: true,
  about: true,
  gender: true,
  avatar: true,
  postsCount: true,
  followersCount: true,
  followingCount: true,
  updatedAt: true,
  isPrivate: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly relations: RelationsService,
    private readonly follows: FollowsService,
  ) {}

  async assertExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw notFound(ErrorCode.USER_NOT_FOUND);
  }

  async getUsers(
    me: string,
    q: {
      UserName?: string;
      Email?: string;
      PageNumber: number;
      PageSize: number;
    },
  ) {
    const where = {
      id: { notIn: await this.relations.blockedIds(me) },
      ...(q.UserName
        ? { userName: { contains: q.UserName.toLowerCase() } }
        : {}),
      // Email faqat aynan (bidun justujui qismi): email-hoi begona-ro ruyxat kardan namesavad
      ...(q.Email ? { email: q.Email.trim().toLowerCase() } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: { ...userShortSelect, email: true, followersCount: true },
        orderBy: [{ followersCount: "desc" }, { userName: "asc" }],
        ...skipTake(q),
      }),
      this.prisma.user.count({ where }),
    ]);
    const items: UserListItem[] = rows.map((u) => ({
      id: u.id,
      userName: u.userName,
      fullName: u.fullName,
      // Email — ma'lumoti shaxsi: faqat baroi xudam
      email: u.id === me ? u.email : "",
      avatar: u.avatar,
      subscribersCount: u.followersCount,
    }));
    return { items, total };
  }

  async deleteUser(me: string, userId: string) {
    if (me !== userId) throw forbidden(ErrorCode.FORBIDDEN);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });
    if (!user) throw notFound(ErrorCode.USER_NOT_FOUND);
    // Counter-hoi follow-i userhoi digar pesh az hazf kam meshavand
    await this.prisma.$transaction(async (tx) => {
      const following = await tx.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followers = await tx.follow.findMany({
        where: { followingId: userId },
        select: { followerId: true },
      });
      if (following.length)
        await tx.user.updateMany({
          where: { id: { in: following.map((f) => f.followingId) } },
          data: { followersCount: { decrement: 1 } },
        });
      if (followers.length)
        await tx.user.updateMany({
          where: { id: { in: followers.map((f) => f.followerId) } },
          data: { followingCount: { decrement: 1 } },
        });
      await tx.user.delete({ where: { id: userId } });
    });
    this.storage.remove(user.avatar);
    return true;
  }

  /** Spec 13 §5: avval follow-i follow-hoi man, ba'd populyartarin */
  async getSuggestions(me: string, limit: number): Promise<Suggestion[]> {
    const following = await this.prisma.follow.findMany({
      where: { followerId: me },
      select: { followingId: true },
    });
    const exclude = [
      me,
      ...following.map((f) => f.followingId),
      ...(await this.relations.blockedIds(me)),
    ];
    const select = { ...userShortSelect, followersCount: true } as const;
    const friendsOfFriends = following.length
      ? await this.prisma.user.findMany({
          where: {
            id: { notIn: exclude },
            followers: {
              some: { followerId: { in: following.map((f) => f.followingId) } },
            },
          },
          select,
          orderBy: [{ followersCount: "desc" }, { userName: "asc" }],
          take: limit,
        })
      : [];
    const popular = await this.prisma.user.findMany({
      where: {
        id: { notIn: [...exclude, ...friendsOfFriends.map((u) => u.id)] },
      },
      select,
      orderBy: [{ followersCount: "desc" }, { userName: "asc" }],
      take: limit - friendsOfFriends.length,
    });
    return [...friendsOfFriends, ...popular].map((u) => ({
      ...toUserShort(u),
      subscribersCount: u.followersCount,
    }));
  }

  // ---- Search history ----

  async addSearchHistory(userId: string, text: string) {
    const h = await this.prisma.searchHistory.create({
      data: { userId, text },
    });
    return { id: h.id, text: h.text, createdAt: h.createdAt.toISOString() };
  }

  async getSearchHistories(userId: string) {
    const rows = await this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map((h) => ({
      id: h.id,
      text: h.text,
      createdAt: h.createdAt.toISOString(),
    }));
  }

  async deleteSearchHistory(userId: string, id?: number) {
    const { count } = await this.prisma.searchHistory.deleteMany({
      where: { userId, ...(id ? { id } : {}) },
    });
    if (id && count === 0) throw notFound(ErrorCode.NOT_FOUND);
    return true;
  }

  async addUserSearchHistory(
    userId: string,
    userSearchId: string,
  ): Promise<UserSearchHistory> {
    await this.assertExists(userSearchId);
    // Takror → hamon satr bo vaqti nav (bolo meravad)
    const h = await this.prisma.userSearchHistory.upsert({
      where: { userId_userSearchId: { userId, userSearchId } },
      create: { userId, userSearchId },
      update: { createdAt: new Date() },
      include: { userSearch: { select: userShortSelect } },
    });
    return {
      id: h.id,
      createdAt: h.createdAt.toISOString(),
      users: toUserShort(h.userSearch),
    };
  }

  async getUserSearchHistories(userId: string): Promise<UserSearchHistory[]> {
    const rows = await this.prisma.userSearchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { userSearch: { select: userShortSelect } },
    });
    return rows.map((h) => ({
      id: h.id,
      createdAt: h.createdAt.toISOString(),
      users: toUserShort(h.userSearch),
    }));
  }

  async deleteUserSearchHistory(userId: string, id?: number) {
    const { count } = await this.prisma.userSearchHistory.deleteMany({
      where: { userId, ...(id ? { id } : {}) },
    });
    if (id && count === 0) throw notFound(ErrorCode.NOT_FOUND);
    return true;
  }

  // ---- Profile ----

  /** Profil-i begona: blok → 404 (Spec 14 §1.2) */
  async getProfileFor(me: string, userId: string): Promise<UserProfile> {
    if (await this.relations.isBlockedEither(me, userId))
      throw notFound(ErrorCode.USER_NOT_FOUND);
    const profile = await this.getProfile(userId);
    // Email-i user-i digar nishon doda nameshavad
    return userId === me ? profile : { ...profile, email: "" };
  }

  /** Private → public: hamai darxostho qabul (Spec 14 §1.1) */
  async updatePrivacy(me: string, isPrivate: boolean) {
    await this.prisma.user.update({ where: { id: me }, data: { isPrivate } });
    if (!isPrivate) await this.follows.acceptAll(me);
    return this.getProfile(me);
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    });
    if (!u) throw notFound(ErrorCode.USER_NOT_FOUND);
    return {
      userId: u.id,
      userName: u.userName,
      fullName: u.fullName,
      email: u.email,
      about: u.about,
      website: u.website,
      gender: u.gender === 0 || u.gender === 1 ? u.gender : null,
      image: u.avatar,
      postCount: u.postsCount,
      subscribersCount: u.followersCount,
      subscriptionsCount: u.followingCount,
      dateUpdated: u.updatedAt.toISOString(),
      isPrivate: u.isPrivate,
    };
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    if (dto.userName) {
      if ((RESERVED_USERNAMES as readonly string[]).includes(dto.userName))
        throw badRequest(ErrorCode.USERNAME_RESERVED);
      const existing = await this.prisma.user.findUnique({
        where: { userName: dto.userName },
        select: { id: true },
      });
      if (existing && existing.id !== userId)
        throw conflict(ErrorCode.USERNAME_TAKEN);
    }
    try {
      await this.prisma.user.update({ where: { id: userId }, data: dto });
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict(ErrorCode.USERNAME_TAKEN);
      throw error;
    }
    return this.getProfile(userId);
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const fileName = await this.storage.save(file, "image");
    const old = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: fileName },
    });
    this.storage.remove(old?.avatar);
    return this.getProfile(userId);
  }

  async deleteAvatar(userId: string) {
    const old = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
    });
    this.storage.remove(old?.avatar);
    return this.getProfile(userId);
  }
}
