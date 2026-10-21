import { Body, Controller, Delete, Get, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { chatIdQuerySchema, createChatQuerySchema, deleteMessageQuerySchema, sendMessageBodySchema } from '@repo/shared';
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
    return ok(await this.chat.sendMessage(me.id, body.ChatId, body.MessageText, file));
  }

  @Delete('delete-message')
  async deleteMessage(@CurrentUser() me: AuthUser, @Query(new ZodPipe(deleteMessageQuerySchema)) q: z.infer<typeof deleteMessageQuerySchema>) {
    return ok(await this.chat.deleteMessage(me.id, q.massageId));
  }

  @Delete('delete-chat')
  async deleteChat(@CurrentUser() me: AuthUser, @Query(new ZodPipe(chatIdQuerySchema)) q: ChatIdQuery) {
    return ok(await this.chat.deleteChat(me.id, q.chatId));
  }
}
