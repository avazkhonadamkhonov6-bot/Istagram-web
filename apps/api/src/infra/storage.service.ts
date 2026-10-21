import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ErrorCode, MEDIA_RULES } from '@repo/shared';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { AppException } from '../common/app-exception';
import { APP_CONFIG, AppConfig } from './config';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

export type UploadKind = 'image' | 'media';

/**
 * Nigohdorii faylho dar disk (UPLOAD_DIR), dastras dar /images/<fileName>.
 * Interfeys sodda ast, ki ba'dan ba S3 ivaz kardan oson boshad.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  readonly root: string;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.root = resolve(config.UPLOAD_DIR);
  }

  isVideo(mime: string): boolean {
    return (MEDIA_RULES.videoTypes as readonly string[]).includes(mime);
  }

  /** Tip va andozaro tekshirad; `image` — faqat aks, `media` — aks yo video. */
  assertAllowed(file: Express.Multer.File, kind: UploadKind) {
    const isImage = (MEDIA_RULES.imageTypes as readonly string[]).includes(file.mimetype);
    const isVideo = this.isVideo(file.mimetype);
    if (!isImage && !(kind === 'media' && isVideo)) {
      throw new AppException(HttpStatus.BAD_REQUEST, ErrorCode.MEDIA_TYPE_NOT_ALLOWED);
    }
    const max = isVideo ? MEDIA_RULES.maxVideoBytes : MEDIA_RULES.maxImageBytes;
    if (file.size > max) {
      throw new AppException(HttpStatus.BAD_REQUEST, ErrorCode.MEDIA_TOO_LARGE);
    }
  }

  async save(file: Express.Multer.File, kind: UploadKind): Promise<string> {
    this.assertAllowed(file, kind);
    const ext = EXT_BY_MIME[file.mimetype] ?? extname(file.originalname).toLowerCase();
    const fileName = `${randomUUID()}${ext}`;
    await mkdir(this.root, { recursive: true });
    await writeFile(join(this.root, fileName), file.buffer);
    return fileName;
  }

  /** Hazf dar fon: xato ba user namerasad. */
  remove(fileName: string | null | undefined) {
    if (!fileName) return;
    unlink(join(this.root, fileName)).catch((err: Error) =>
      this.logger.warn(`Fayl hazf nashud: ${fileName} (${err.message})`),
    );
  }
}
