import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, loadConfig } from './config';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';
import { StorageService } from './storage.service';

@Global()
@Module({
  controllers: [HealthController],
  providers: [{ provide: APP_CONFIG, useFactory: loadConfig }, PrismaService, StorageService],
  exports: [APP_CONFIG, PrismaService, StorageService],
})
export class InfraModule {}
