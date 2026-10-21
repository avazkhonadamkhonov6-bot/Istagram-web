import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { loadConfig } from './infra/config';
import { configureApp } from './setup';

async function bootstrap() {
  // Avval .env tekshirida meshavad (Spec 11 AC2), ba'd modulho bor meshavand
  const config = loadConfig();
  const { AppModule } = await import('./app.module');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  configureApp(app, config);
  await app.listen(config.PORT);
}

bootstrap().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
