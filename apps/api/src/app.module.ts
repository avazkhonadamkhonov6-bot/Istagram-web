import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { StatusOkInterceptor } from './common/status.interceptor';
import { loadConfig } from './infra/config';
import { InfraModule } from './infra/infra.module';
import { AccountModule } from './modules/account/account.module';
import { ChatModule } from './modules/chat/chat.module';
import { FollowsModule } from './modules/follows/follows.module';
import { LocationModule } from './modules/location/location.module';
import { PostsModule } from './modules/posts/posts.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { StoriesModule } from './modules/stories/stories.module';
import { UsersModule } from './modules/users/users.module';

const config = loadConfig();

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: config.NODE_ENV === 'production' ? 'info' : 'debug',
        transport: config.NODE_ENV === 'development' ? { target: 'pino-pretty', options: { singleLine: true } } : undefined,
        genReqId: (req, res) => {
          const id = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        // Parol, token va cookie dar log pinhon (Spec 11 AC6)
        redact: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password', 'req.body.confirmPassword', 'req.query.Password', 'req.query.OldPassword', 'req.query.ConfirmPassword', 'req.query.Token'],
      },
    }),
    JwtModule.register({ global: true, secret: config.JWT_SECRET, signOptions: { expiresIn: config.JWT_EXPIRES_IN as never } }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),
    InfraModule,
    RealtimeModule,
    AccountModule,
    FollowsModule,
    PostsModule,
    UsersModule,
    StoriesModule,
    ChatModule,
    LocationModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: StatusOkInterceptor },
  ],
})
export class AppModule {}
