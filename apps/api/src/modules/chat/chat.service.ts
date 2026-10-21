import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ChatDto, ErrorCode, MessageDto, SocketEvent } from '@repo/shared';
import { badRequest, forbidden, notFound } from '../../common/app-exception';
import { userShortSelect } from '../../common/mappers';
import { PrismaService } from '../../infra/prisma.service';
import { StorageService } from '../../infra/storage.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const messageInclude = {
  user: { select: userShortSelect },
  sharedPost: {
    select: {
      id: true,
      user: { select: { userName: true } },
      images: { orderBy: { order: 'asc' }, take: 1, select: { fileName: true } },
    },
  },
} satisfies Prisma.MessageInclude;
type MessageRow = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;

/** Kalidi yakxela baroi jufti user — yak chat bayni du user (Spec 08 AC2) */
const pairKey = (a: string, b: string) => (a < b ? `${a}:${b}` : `${b}:${a}`);

type ChatSides = { sendUserId: string; receiveUserId: string; sendUserReadAt: Date | null; receiveUserReadAt: Date | null };

/** readAt-i man va tarafi digar */
function sides(chat: ChatSides, me: string) {
  const iAmSender = chat.sendUserId === me;
  return {
    peerId: iAmSender ? chat.receiveUserId : chat.sendUserId,
    myReadAt: iAmSender ? chat.sendUserReadAt : chat.receiveUserReadAt,
    peerReadAt: iAmSender ? chat.receiveUserReadAt : chat.sendUserReadAt,
    myReadField: iAmSender ? ('sendUserReadAt' as const) : ('receiveUserReadAt' as const),
  };
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly realtime: RealtimeGateway,
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
    };
  }

  /** Faqat ishtirokchi (Spec 08 AC3) */
  async assertMember(me: string, chatId: number) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, sendUserId: true, receiveUserId: true, sendUserReadAt: true, receiveUserReadAt: true },
    });
    if (!chat) throw notFound(ErrorCode.CHAT_NOT_FOUND);
    if (chat.sendUserId !== me && chat.receiveUserId !== me) throw forbidden(ErrorCode.FORBIDDEN);
    return { ...chat, ...sides(chat, me) };
  }

  async getChats(me: string): Promise<ChatDto[]> {
    const chats = await this.prisma.chat.findMany({
      where: { OR: [{ sendUserId: me }, { receiveUserId: me }] },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        sendUser: { select: userShortSelect },
        receiveUser: { select: userShortSelect },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: messageInclude },
      },
    });
    const unread = await this.unreadByChat(me, chats);
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
    }));
  }

  /** Paymhoi tarafi digar pas az readAt-i man — yak query bo groupBy (bidun N+1) */
  private async unreadByChat(me: string, chats: (ChatSides & { id: number })[]) {
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
      where: { OR: [{ sendUserId: me }, { receiveUserId: me }] },
      select: { id: true, sendUserId: true, receiveUserId: true, sendUserReadAt: true, receiveUserReadAt: true },
    });
    const unread = await this.unreadByChat(me, chats);
    return { count: [...unread.values()].filter((n) => n > 0).length };
  }

  /** "Seen": readAt = now, tarafi digar `chat:read` megirad */
  async readChat(me: string, chatId: number) {
    const chat = await this.assertMember(me, chatId);
    const readAt = new Date();
    await this.prisma.chat.update({ where: { id: chatId }, data: { [chat.myReadField]: readAt } });
    const payload = { chatId, userId: me, readAt: readAt.toISOString() };
    this.realtime.emitToUser(chat.peerId, SocketEvent.CHAT_READ, payload);
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
    // upsert bo kalidi yakxela — du darxosti parallel ham yak chat mesozand
    const chat = await this.prisma.chat.upsert({
      where: { pairKey: pairKey(me, receiverUserId) },
      create: { sendUserId: me, receiveUserId: receiverUserId, pairKey: pairKey(me, receiverUserId) },
      update: {},
      select: { id: true },
    });
    return chat.id;
  }

  async sendMessage(me: string, chatId: number, text: string | undefined, file?: Express.Multer.File, sharedPostId?: number) {
    if (!text && !file && !sharedPostId) throw badRequest(ErrorCode.VALIDATION_ERROR);
    const chat = await this.assertMember(me, chatId);
    if (sharedPostId) {
      const post = await this.prisma.post.findUnique({ where: { id: sharedPostId }, select: { id: true } });
      if (!post) throw notFound(ErrorCode.POST_NOT_FOUND);
    }
    const fileName = file ? await this.storage.save(file, 'media') : null;
    const message = await this.prisma.$transaction(async (tx) => {
      const m = await tx.message.create({
        data: { chatId, userId: me, messageText: text || null, file: fileName, sharedPostId: sharedPostId ?? null },
        include: messageInclude,
      });
      // Firistanda paymi xudro xondaast
      await tx.chat.update({ where: { id: chatId }, data: { lastMessageAt: m.createdAt, [chat.myReadField]: m.createdAt } });
      return m;
    });
    const dto = this.toMessageDto(message);
    // Manba'i haqiqat — DB; socket faqat xabar medihad
    this.realtime.emitToUser(chat.peerId, SocketEvent.MESSAGE_NEW, dto);
    return dto;
  }

  async deleteMessage(me: string, messageId: number) {
    const m = await this.prisma.message.findUnique({ where: { id: messageId }, select: { userId: true, chatId: true, file: true } });
    if (!m) throw notFound(ErrorCode.MESSAGE_NOT_FOUND);
    if (m.userId !== me) throw forbidden();
    const chat = await this.assertMember(me, m.chatId);
    await this.prisma.message.delete({ where: { id: messageId } });
    this.storage.remove(m.file);
    this.realtime.emitToUser(chat.peerId, SocketEvent.MESSAGE_DELETED, { messageId, chatId: m.chatId });
    return true;
  }

  async deleteChat(me: string, chatId: number) {
    await this.assertMember(me, chatId);
    const files = await this.prisma.message.findMany({ where: { chatId, file: { not: null } }, select: { file: true } });
    await this.prisma.chat.delete({ where: { id: chatId } });
    files.forEach((f) => this.storage.remove(f.file));
    return true;
  }
}
