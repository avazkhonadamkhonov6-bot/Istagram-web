import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { access, constants } from 'node:fs/promises';
import { Public } from '../common/decorators/public.decorator';
import { MailService } from './mail.service';
import { PrismaService } from './prisma.service';
import { StorageService } from './storage.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly mail: MailService,
  ) {}

  /** db xomush → down (503); papkai faylho dastras nest → degraded (200). mail — holati e-mail (bidun kalid). */
  @Public()
  @Get()
  async check(@Res() res: Response) {
    const db = await this.prisma.$queryRaw`SELECT 1`.then(
      () => 'up',
      () => 'down',
    );
    const storage = await access(this.storage.root, constants.W_OK).then(
      () => 'up',
      () => 'down',
    );
    const status = db === 'down' ? 'down' : storage === 'down' ? 'degraded' : 'ok';
    res.status(db === 'down' ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.OK).json({ status, db, storage, mail: this.mail.status() });
  }
}
