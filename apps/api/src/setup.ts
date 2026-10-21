import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { mkdirSync } from 'node:fs';
import { AppConfig } from './infra/config';
import { StorageService } from './infra/storage.service';

/** Tanzimi umumi baroi main.ts va e2e — test hamon app-i voqe'iro mesanjad */
export function configureApp(app: NestExpressApplication, config: AppConfig) {
  app.set('trust proxy', 1); // IP-i voqe'i az x-forwarded-for (BFF)
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({ origin: config.WEB_ORIGIN, credentials: true });
  app.enableShutdownHooks();

  const storage = app.get(StorageService);
  mkdirSync(storage.root, { recursive: true });
  // Fayli gumshuda az disk (restart-i Render) — avval az DB bargardonida meshavad
  app.use('/images', (req: Request, _res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    let name: string;
    try {
      name = decodeURIComponent(req.path.slice(1));
    } catch {
      return next();
    }
    storage.restore(name).then(
      () => next(),
      () => next(),
    );
  });
  app.useStaticAssets(storage.root, { prefix: '/images/', maxAge: '365d', immutable: true });

  const doc = new DocumentBuilder()
    .setTitle('Instagram API')
    .setDescription('Kontrakt: docs/specs/12-api-kontrakt.md')
    .setVersion('v1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('swagger', app, SwaggerModule.createDocument(app, doc), {
    swaggerOptions: { persistAuthorization: true },
  });
}
