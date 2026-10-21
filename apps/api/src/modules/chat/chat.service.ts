import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ChatDto, ErrorCode, MessageDto, SocketEvent } from '@repo/shared';
import { badRequest, forbidden, notFound } from '../../common/app-exception';
import { userShortSelect } from '../../common/mappers';
import { PrismaService } from '../../infra/prisma.service';
import { StorageService } from '../../infra/storage.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const messageInclude = { user: { select: userShortSelect } } satisfies Prisma.MessageInclude;
type MessageRow = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;

/** Kalidi yakxela baroi jufti user — yak chat bayni du nafar (Spec 08 AC2) */
const pairKey = (a: string, b: string) => (a < b ? `${a}:${b}` : `${b}:${a}`);

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
    };
  }

  /** Faqat ishtirokchi (Spec 08 AC3) */
  private async assertMember(me: string, chatId: number) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId }, select: { id: true, sendUserId: true, receiveUserId: true } });
    if (!chat) throw notFound(ErrorCode.CHAT_NOT_FOUND);
    if (chat.sendUserId !== me && chat.receiveUserId !== me) throw forbidden(ErrorCode.FORBIDDEN);
    return { ...chat, peerId: chat.sendUserId === me ? chat.receiveUserId : chat.sendUserId };
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
    return chats.map((c) => ({
      chatId: c.id,
      sendUserId: c.sendUserId,
      sendUserName: c.sendUser.userName,
      sendUserImage: c.sendUser.avatar,
      receiveUserId: c.receiveUserId,
      receiveUserName: c.receiveUser.userName,
      receiveUserImage: c.receiveUser.avatar,
      lastMessage: c.messages[0] ? this.toMessageDto(c.messages[0]) : null,
    }));
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

  async sendMessage(me: string, chatId: number, text: string | undefined, file?: Express.Multer.File) {
    if (!text && !file) throw badRequest(ErrorCode.VALIDATION_ERROR);
    const chat = await this.assertMember(me, chatId);
    const fileName = file ? await this.storage.save(file, 'media') : null;
    const message = await this.prisma.$transaction(async (tx) => {
      const m = await tx.message.create({ data: { chatId, userId: me, messageText: text || null, file: fileName }, include: messageInclude });
      await tx.chat.update({ where: { id: chatId }, data: { lastMessageAt: m.createdAt } });
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
