import { Body, Controller, Delete, Get, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  addGroupMembersSchema,
  chatIdQuerySchema,
  createChatQuerySchema,
  createGroupSchema,
  deleteMessageQuerySchema,
  messageIdQuerySchema,
  sendMessageBodySchema,
  updateGroupSchema,
} from '@repo/shared';
import type { z } from 'zod';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok } from '../../common/response';
import { uploadLimits } from '../../common/upload';
import { ChatService } from './chat.service';

type ChatIdQuery = z.infer<typeof chatIdQuerySchema>;

@ApiTags('Chat')
@Controller('Chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('get-chats')
  async getChats(@CurrentUser() me: AuthUser) {
    return ok(await this.chat.getChats(me.id));
  }

  @Get('get-chat-by-id')
  async getById(@CurrentUser() me: AuthUser, @Query(new ZodPipe(chatIdQuerySchema)) q: ChatIdQuery) {
    return ok(await this.chat.getMessages(me.id, q.chatId));
  }

  @Post('create-chat')
  async create(@CurrentUser() me: AuthUser, @Query(new ZodPipe(createChatQuerySchema)) q: z.infer<typeof createChatQuerySchema>) {
    return ok(await this.chat.createChat(me.id, q.receiverUserId));
  }

  @Put('send-message')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('File', { limits: uploadLimits }))
  async send(
    @CurrentUser() me: AuthUser,
    @Body(new ZodPipe(sendMessageBodySchema)) body: z.infer<typeof sendMessageBodySchema>,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return ok(
      await this.chat.sendMessage(me.id, body.ChatId, {
        text: body.MessageText,
        file,
        sharedPostId: body.SharedPostId,
        sharedStoryId: body.SharedStoryId,
        replyToId: body.ReplyToMessageId,
      }),
    );
  }

  /** Spec 13 §4 */
  @Post('read-chat')
  async read(@CurrentUser() me: AuthUser, @Query(new ZodPipe(chatIdQuerySchema)) q: ChatIdQuery) {
    return ok(await this.chat.readChat(me.id, q.chatId));
  }

  @Get('get-unread-count')
  async unreadCount(@CurrentUser() me: AuthUser) {
    return ok(await this.chat.unreadCount(me.id));
  }

  @Delete('delete-message')
  async deleteMessage(@CurrentUser() me: AuthUser, @Query(new ZodPipe(deleteMessageQuerySchema)) q: z.infer<typeof deleteMessageQuerySchema>) {
    return ok(await this.chat.deleteMessage(me.id, q.massageId));
  }

  @Delete('delete-chat')
  async deleteChat(@CurrentUser() me: AuthUser, @Query(new ZodPipe(chatIdQuerySchema)) q: ChatIdQuery) {
    return ok(await this.chat.deleteChat(me.id, q.chatId));
  }

  /** Spec 14 §4 */
  @Post('like-message')
  async likeMessage(@CurrentUser() me: AuthUser, @Query(new ZodPipe(messageIdQuerySchema)) q: z.infer<typeof messageIdQuerySchema>) {
    return ok(await this.chat.likeMessage(me.id, q.messageId));
  }

  @Post('create-group')
  async createGroup(@CurrentUser() me: AuthUser, @Body(new ZodPipe(createGroupSchema)) dto: z.infer<typeof createGroupSchema>) {
    return ok(await this.chat.createGroup(me.id, dto.title, dto.userIds));
  }

  @Put('update-group')
  async updateGroup(@CurrentUser() me: AuthUser, @Body(new ZodPipe(updateGroupSchema)) dto: z.infer<typeof updateGroupSchema>) {
    return ok(await this.chat.updateGroup(me.id, dto.chatId, dto.title));
  }

  @Post('add-group-members')
  async addMembers(@CurrentUser() me: AuthUser, @Body(new ZodPipe(addGroupMembersSchema)) dto: z.infer<typeof addGroupMembersSchema>) {
    return ok(await this.chat.addMembers(me.id, dto.chatId, dto.userIds));
  }

  @Delete('leave-group')
  async leaveGroup(@CurrentUser() me: AuthUser, @Query(new ZodPipe(chatIdQuerySchema)) q: ChatIdQuery) {
    return ok(await this.chat.leaveGroup(me.id, q.chatId));
  }
}
