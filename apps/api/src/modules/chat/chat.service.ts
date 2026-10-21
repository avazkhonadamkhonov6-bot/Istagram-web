import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ChatDto, ErrorCode, MESSAGE_EDIT_WINDOW_MS, MessageDto, SocketEvent } from '@repo/shared';
import { randomUUID } from 'node:crypto';
import { badRequest, forbidden, notFound } from '../../common/app-exception';
import { toUserShort, userShortSelect } from '../../common/mappers';
import { PrismaService } from '../../infra/prisma.service';
import { StorageService } from '../../infra/storage.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RelationsService } from '../relations/relations.service';

const messageInclude = {
  user: { select: userShortSelect },
  sharedPost: {
    select: {
      id: true,
      user: { select: { userName: true } },
      images: { orderBy: { order: 'asc' }, take: 1, select: { fileName: true } },
    },
  },
  likes: { select: { userId: true } },
  replyTo: { select: { id: true, messageText: true, file: true, user: { select: { userName: true } } } },
  story: { select: { id: true, fileName: true, expiresAt: true, user: { select: { userName: true } } } },
} satisfies Prisma.MessageInclude;
type MessageRow = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;

/** Kalidi yakxela baroi jufti user — yak chat bayni du user (Spec 08 AC2) */
const pairKey = (a: string, b: string) => (a < b ? `${a}:${b}` : `${b}:${a}`);

const chatMetaSelect = {
  id: true,
  isGroup: true,
  sendUserId: true,
  receiveUserId: true,
  sendUserReadAt: true,
  receiveUserReadAt: true,
  members: { select: { userId: true, readAt: true } },
} satisfies Prisma.ChatSelect;
type ChatMeta = Prisma.ChatGetPayload<{ select: typeof chatMetaSelect }>;

/** Ishtirokchiyon va readAt baroi chat-i 1:1 va group (Spec 14 §4) */
function sides(chat: ChatMeta, me: string) {
  if (chat.isGroup) {
    const others = chat.members.filter((m) => m.userId !== me);
    const reads = others.map((m) => m.readAt);
    return {
      peers: others.map((m) => m.userId),
      myReadAt: chat.members.find((m) => m.userId === me)?.readAt ?? null,
      // "Seen" — vaqte ki hama xondand
      peerReadAt: reads.length && reads.every((r) => r) ? new Date(Math.min(...reads.map((r) => r!.getTime()))) : null,
    };
  }
  const iAmSender = chat.sendUserId === me;
  return {
    peers: [iAmSender ? chat.receiveUserId : chat.sendUserId],
    myReadAt: iAmSender ? chat.sendUserReadAt : chat.receiveUserReadAt,
    peerReadAt: iAmSender ? chat.receiveUserReadAt : chat.sendUserReadAt,
  };
}

const isMember = (chat: ChatMeta, me: string) =>
  chat.isGroup ? chat.members.some((m) => m.userId === me) : chat.sendUserId === me || chat.receiveUserId === me;

export type SendOptions = {
  text?: string;
  file?: Express.Multer.File;
  sharedPostId?: number;
  sharedStoryId?: number;
  replyToId?: number;
};

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly realtime: RealtimeGateway,
    private readonly relations: RelationsService,
  ) {}

  private toMessageDto(m: MessageRow): MessageDto {
    return {
      messageId: m.id,
      chatId: m.chatId,
      userId: m.userId,
      userName: m.user.userName,
      userImage: m.user.avatar,
      messageText: m.messageText,
      file: m.file,
      sendMassageDate: m.createdAt.toISOString(),
      sharedPost: m.sharedPost
        ? { postId: m.sharedPost.id, image: m.sharedPost.images[0]?.fileName ?? null, userName: m.sharedPost.user.userName }
        : null,
      fileType: m.file ? ((m.fileType as MessageDto['fileType']) ?? 'image') : null,
      likes: m.likes.map((l) => l.userId),
      replyTo: m.replyTo ? { messageId: m.replyTo.id, userName: m.replyTo.user.userName, text: m.replyTo.messageText } : null,
      story: m.story
        ? { storyId: m.story.id, fileName: m.story.fileName, userName: m.story.user.userName, isExpired: m.story.expiresAt < new Date() }
        : null,
      editedAt: m.editedAt?.toISOString() ?? null,
    };
  }

  private emit(userIds: string[], event: string, payload: unknown) {
    userIds.forEach((id) => this.realtime.emitToUser(id, event, payload));
  }

  /** Faqat ishtirokchi (Spec 08 AC3) */
  async assertMember(me: string, chatId: number) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId }, select: chatMetaSelect });
    if (!chat) throw notFound(ErrorCode.CHAT_NOT_FOUND);
    if (!isMember(chat, me)) throw forbidden(ErrorCode.FORBIDDEN);
    return { ...chat, ...sides(chat, me) };
  }

  /** ID-hoi a'zo baroi socket (gateway-i typing) */
  async memberIds(chatId: number): Promise<string[]> {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId }, select: chatMetaSelect });
    if (!chat) return [];
    return chat.isGroup ? chat.members.map((m) => m.userId) : [chat.sendUserId, chat.receiveUserId];
  }

  private async markRead(tx: Prisma.TransactionClient, chat: ChatMeta, me: string, at: Date) {
    if (chat.isGroup) {
      await tx.chatMember.update({ where: { chatId_userId: { chatId: chat.id, userId: me } }, data: { readAt: at } });
    } else {
      await tx.chat.update({ where: { id: chat.id }, data: { [chat.sendUserId === me ? 'sendUserReadAt' : 'receiveUserReadAt']: at } });
    }
  }

  async getChats(me: string): Promise<ChatDto[]> {
    const chats = await this.prisma.chat.findMany({
      where: { OR: [{ isGroup: false, OR: [{ sendUserId: me }, { receiveUserId: me }] }, { members: { some: { userId: me } } }] },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        sendUser: { select: userShortSelect },
        receiveUser: { select: userShortSelect },
        members: { select: { userId: true, readAt: true, user: { select: userShortSelect } }, orderBy: { joinedAt: 'asc' } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: messageInclude },
      },
    });
    const unread = await this.unreadByChat(me, chats);
    // "Active now" baroi tarafi digari chat-i 1:1 (Spec 15 §4); blok — pinhon
    const peerIds = chats.filter((c) => !c.isGroup).map((c) => (c.sendUserId === me ? c.receiveUserId : c.sendUserId));
    const [peers, blocked] = await Promise.all([
      this.prisma.user.findMany({ where: { id: { in: peerIds } }, select: { id: true, lastActiveAt: true } }),
      this.relations.blockedIds(me),
    ]);
    const lastActive = new Map(peers.map((p) => [p.id, p.lastActiveAt]));
    const presence = (c: { isGroup: boolean; sendUserId: string; receiveUserId: string }) => {
      const peer = c.sendUserId === me ? c.receiveUserId : c.sendUserId;
      if (c.isGroup || blocked.includes(peer)) return { peerIsOnline: false, peerLastActiveAt: null };
      return { peerIsOnline: this.realtime.isOnline(peer), peerLastActiveAt: lastActive.get(peer)?.toISOString() ?? null };
    };
    return chats.map((c) => ({
      chatId: c.id,
      sendUserId: c.sendUserId,
      sendUserName: c.sendUser.userName,
      sendUserImage: c.sendUser.avatar,
      receiveUserId: c.receiveUserId,
      receiveUserName: c.receiveUser.userName,
      receiveUserImage: c.receiveUser.avatar,
      lastMessage: c.messages[0] ? this.toMessageDto(c.messages[0]) : null,
      unreadCount: unread.get(c.id) ?? 0,
      peerReadAt: sides(c, me).peerReadAt?.toISOString() ?? null,
      isGroup: c.isGroup,
      title: c.title,
      members: c.members.map((m) => toUserShort(m.user)),
      ...presence(c),
    }));
  }

  /** Paymhoi digaron pas az readAt-i man — yak query bo groupBy (bidun N+1) */
  private async unreadByChat(me: string, chats: ChatMeta[]) {
    if (!chats.length) return new Map<number, number>();
    const rows = await this.prisma.message.groupBy({
      by: ['chatId'],
      where: {
        userId: { not: me },
        OR: chats.map((c) => {
          const readAt = sides(c, me).myReadAt;
          return readAt ? { chatId: c.id, createdAt: { gt: readAt } } : { chatId: c.id };
        }),
      },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.chatId, r._count._all]));
  }

  /** Badge dar sidebar: shumorai chat-hoi bo paymi naxonda (Spec 13 §4) */
  async unreadCount(me: string) {
    const chats = await this.prisma.chat.findMany({
      where: { OR: [{ isGroup: false, OR: [{ sendUserId: me }, { receiveUserId: me }] }, { members: { some: { userId: me } } }] },
      select: chatMetaSelect,
    });
    const unread = await this.unreadByChat(me, chats);
    return { count: [...unread.values()].filter((n) => n > 0).length };
  }

  /** "Seen": readAt = now, digaron `chat:read` megirand */
  async readChat(me: string, chatId: number) {
    const chat = await this.assertMember(me, chatId);
    const readAt = new Date();
    await this.prisma.$transaction((tx) => this.markRead(tx, chat, me, readAt));
    const payload = { chatId, userId: me, readAt: readAt.toISOString() };
    this.emit(chat.peers, SocketEvent.CHAT_READ, payload);
    return { chatId, readAt: payload.readAt };
  }

  /** Paymho bo tartibi xronologi (kuhna → nav) */
  async getMessages(me: string, chatId: number): Promise<MessageDto[]> {
    await this.assertMember(me, chatId);
    const rows = await this.prisma.message.findMany({ where: { chatId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], include: messageInclude });
    return rows.map((m) => this.toMessageDto(m));
  }

  async createChat(me: string, receiverUserId: string): Promise<number> {
    if (me === receiverUserId) throw badRequest(ErrorCode.CANNOT_CHAT_SELF);
    const receiver = await this.prisma.user.findUnique({ where: { id: receiverUserId }, select: { id: true } });
    if (!receiver) throw notFound(ErrorCode.USER_NOT_FOUND);
    if (await this.relations.isBlockedEither(me, receiverUserId)) throw forbidden(ErrorCode.BLOCKED);
    // upsert bo kalidi yakxela — du darxosti parallel ham yak chat mesozand
    const chat = await this.prisma.chat.upsert({
      where: { pairKey: pairKey(me, receiverUserId) },
      create: { sendUserId: me, receiveUserId: receiverUserId, pairKey: pairKey(me, receiverUserId) },
      update: {},
      select: { id: true },
    });
    return chat.id;
  }

  private async assertUsers(me: string, userIds: string[]) {
    const ids = [...new Set(userIds)].filter((id) => id !== me);
    const found = await this.prisma.user.count({ where: { id: { in: ids } } });
    if (found !== ids.length) throw notFound(ErrorCode.USER_NOT_FOUND);
    const blocked = new Set(await this.relations.blockedIds(me));
    if (ids.some((id) => blocked.has(id))) throw forbidden(ErrorCode.BLOCKED);
    return ids;
  }

  /** Group chat (Spec 14 §4) */
  async createGroup(me: string, title: string, userIds: string[]): Promise<number> {
    const ids = await this.assertUsers(me, userIds);
    if (ids.length < 2) throw badRequest(ErrorCode.VALIDATION_ERROR);
    const chat = await this.prisma.chat.create({
      data: {
        isGroup: true,
        title,
        sendUserId: me,
        receiveUserId: me,
        pairKey: `group:${randomUUID()}`,
        members: { create: [{ userId: me, readAt: new Date() }, ...ids.map((userId) => ({ userId }))] },
      },
      select: { id: true },
    });
    return chat.id;
  }

  private async assertGroup(me: string, chatId: number) {
    const chat = await this.assertMember(me, chatId);
    if (!chat.isGroup) throw badRequest(ErrorCode.NOT_GROUP);
    return chat;
  }

  async updateGroup(me: string, chatId: number, title: string) {
    await this.assertGroup(me, chatId);
    await this.prisma.chat.update({ where: { id: chatId }, data: { title } });
    return true;
  }

  async addMembers(me: string, chatId: number, userIds: string[]) {
    await this.assertGroup(me, chatId);
    const ids = await this.assertUsers(me, userIds);
    await this.prisma.chatMember.createMany({ data: ids.map((userId) => ({ chatId, userId })), skipDuplicates: true });
    return true;
  }

  /** Agar a'zoi ohirin baromad — chat hazf meshavad */
  async leaveGroup(me: string, chatId: number) {
    await this.assertGroup(me, chatId);
    await this.prisma.chatMember.delete({ where: { chatId_userId: { chatId, userId: me } } });
    if ((await this.prisma.chatMember.count({ where: { chatId } })) === 0) await this.prisma.chat.delete({ where: { id: chatId } });
    return true;
  }

  async sendMessage(me: string, chatId: number, opts: SendOptions, storyReplyId?: number) {
    const { text, file, sharedPostId, sharedStoryId, replyToId } = opts;
    if (!text && !file && !sharedPostId && !sharedStoryId) throw badRequest(ErrorCode.VALIDATION_ERROR);
    const chat = await this.assertMember(me, chatId);
    if (!chat.isGroup && (await this.relations.isBlockedEither(me, chat.peers[0]!))) throw forbidden(ErrorCode.BLOCKED);
    if (sharedPostId) {
      const post = await this.prisma.post.findUnique({ where: { id: sharedPostId }, select: { id: true } });
      if (!post) throw notFound(ErrorCode.POST_NOT_FOUND);
    }
    const storyId = sharedStoryId ?? storyReplyId;
    if (storyId) {
      const story = await this.prisma.story.findUnique({ where: { id: storyId }, select: { id: true } });
      if (!story) throw notFound(ErrorCode.STORY_NOT_FOUND);
    }
    if (replyToId) {
      const target = await this.prisma.message.findUnique({ where: { id: replyToId }, select: { chatId: true } });
      if (!target || target.chatId !== chatId) throw notFound(ErrorCode.MESSAGE_NOT_FOUND);
    }
    if (file) this.storage.assertAllowed(file, 'chat');
    const fileName = file ? await this.storage.save(file, 'chat') : null;
    const message = await this.prisma.$transaction(async (tx) => {
      const m = await tx.message.create({
        data: {
          chatId,
          userId: me,
          messageText: text || null,
          file: fileName,
          fileType: file ? this.storage.fileType(file.mimetype) : null,
          sharedPostId: sharedPostId ?? null,
          storyId: storyId ?? null,
          replyToId: replyToId ?? null,
        },
        include: messageInclude,
      });
      // Firistanda paymi xudro xondaast
      await tx.chat.update({ where: { id: chatId }, data: { lastMessageAt: m.createdAt } });
      await this.markRead(tx, chat, me, m.createdAt);
      return m;
    });
    const dto = this.toMessageDto(message);
    // Manba'i haqiqat — DB; socket faqat xabar medihad
    this.emit(chat.peers, SocketEvent.MESSAGE_NEW, dto);
    return dto;
  }

  /** Javob ba story → paym dar Direct-i muallif (Spec 14 §3) */
  async replyToStory(me: string, storyId: number, text: string) {
    const story = await this.prisma.story.findFirst({ where: { id: storyId, expiresAt: { gt: new Date() } }, select: { userId: true } });
    if (!story) throw notFound(ErrorCode.STORY_NOT_FOUND);
    const chatId = await this.createChat(me, story.userId);
    return this.sendMessage(me, chatId, { text }, storyId);
  }

  /** Dil-i paym (double-tap), toggle (Spec 14 §4) */
  async likeMessage(me: string, messageId: number) {
    const m = await this.prisma.message.findUnique({ where: { id: messageId }, select: { chatId: true } });
    if (!m) throw notFound(ErrorCode.MESSAGE_NOT_FOUND);
    const chat = await this.assertMember(me, m.chatId);
    const { count } = await this.prisma.messageLike.deleteMany({ where: { messageId, userId: me } });
    if (count === 0) await this.prisma.messageLike.createMany({ data: [{ messageId, userId: me }], skipDuplicates: true });
    const row = await this.prisma.message.findUniqueOrThrow({ where: { id: messageId }, include: messageInclude });
    const dto = this.toMessageDto(row);
    this.emit(chat.peers, SocketEvent.MESSAGE_UPDATED, dto);
    return dto;
  }

  /** Tahriri paym (Spec 15 §3): faqat muallif, faqat paymi matni, to 15 daqiqa; socket `message:updated` */
  async editMessage(me: string, messageId: number, text: string) {
    const m = await this.prisma.message.findUnique({ where: { id: messageId }, select: { userId: true, chatId: true, messageText: true, createdAt: true } });
    if (!m) throw notFound(ErrorCode.MESSAGE_NOT_FOUND);
    if (m.userId !== me) throw forbidden(ErrorCode.NOT_OWNER);
    if (!m.messageText) throw badRequest(ErrorCode.VALIDATION_ERROR);
    if (Date.now() - m.createdAt.getTime() > MESSAGE_EDIT_WINDOW_MS) throw badRequest(ErrorCode.EDIT_WINDOW_EXPIRED);
    const chat = await this.assertMember(me, m.chatId);
    const row = await this.prisma.message.update({ where: { id: messageId }, data: { messageText: text, editedAt: new Date() }, include: messageInclude });
    const dto = this.toMessageDto(row);
    this.emit(chat.peers, SocketEvent.MESSAGE_UPDATED, dto);
    return dto;
  }

  async deleteMessage(me: string, messageId: number) {
    const m = await this.prisma.message.findUnique({ where: { id: messageId }, select: { userId: true, chatId: true, file: true } });
    if (!m) throw notFound(ErrorCode.MESSAGE_NOT_FOUND);
    if (m.userId !== me) throw forbidden();
    const chat = await this.assertMember(me, m.chatId);
    await this.prisma.message.delete({ where: { id: messageId } });
    this.storage.remove(m.file);
    this.emit(chat.peers, SocketEvent.MESSAGE_DELETED, { messageId, chatId: m.chatId });
    return true;
  }

  /** Chat-i 1:1 hazf; dar group — baromadan */
  async deleteChat(me: string, chatId: number) {
    const chat = await this.assertMember(me, chatId);
    if (chat.isGroup) return this.leaveGroup(me, chatId);
    const files = await this.prisma.message.findMany({ where: { chatId, file: { not: null } }, select: { file: true } });
    await this.prisma.chat.delete({ where: { id: chatId } });
    files.forEach((f) => this.storage.remove(f.file));
    return true;
  }
}
