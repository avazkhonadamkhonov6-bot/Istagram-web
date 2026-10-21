import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ErrorCode, MEDIA_RULES } from '@repo/shared';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import sharp, { type Sharp } from 'sharp';
import { AppException } from '../common/app-exception';
import { APP_CONFIG, AppConfig } from './config';
import { PrismaService } from './prisma.service';

/** Nomi bexatari fayl (bidun `/`, `..`) — baroi bor kardan az DB */
const SAFE_NAME = /^[\w-]+(\.[\w-]+)*$/;

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'audio/webm': '.weba',
  'audio/ogg': '.ogg',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
};

/** Andozahoi WebP (Spec 03): asosi — 1080, versiyaho — `<id>-640.webp`, `<id>-320.webp` */
export const IMAGE_WIDTH = 1080;
export const IMAGE_VARIANTS = [640, 320] as const;
const WEBP_QUALITY = 82;

/** `chat` — aks, video yo audio (paymi ovozi, Spec 14 §4) */
export type UploadKind = 'image' | 'media' | 'chat';

/**
 * Nigohdorii faylho dar disk (UPLOAD_DIR), dastras dar /images/<fileName>.
 * Har fayl nusxa dar jadvali MediaFile dorad: dar Render (free) disk har restart pok meshavad,
 * fayli gumshuda hangomi darxosti avval az DB ba disk bargardonida meshavad (`restore`).
 * Interfeys sodda ast, ki ba'dan ba S3 ivaz kardan oson boshad.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  readonly root: string;

  constructor(
    @Inject(APP_CONFIG) config: AppConfig,
    private readonly prisma: PrismaService,
  ) {
    this.root = resolve(config.UPLOAD_DIR);
  }

  /** Nusxai faylhoi disk dar DB */
  private async backup(fileNames: string[]) {
    const data = await Promise.all(fileNames.map(async (name) => ({ name, data: await readFile(join(this.root, name)) })));
    await this.prisma.mediaFile.createMany({ data, skipDuplicates: true });
  }

  /** Agar fayl dar disk nest, az DB bor mekunad. `true` — fayl dar disk hast. */
  async restore(fileName: string): Promise<boolean> {
    if (!SAFE_NAME.test(fileName)) return false;
    const path = join(this.root, fileName);
    if (existsSync(path)) return true;
    const row = await this.prisma.mediaFile.findUnique({ where: { name: fileName } });
    if (!row) return false;
    await mkdir(this.root, { recursive: true });
    await writeFile(path, row.data);
    return true;
  }

  isVideo(mime: string): boolean {
    return (MEDIA_RULES.videoTypes as readonly string[]).includes(mime);
  }

  isAudio(mime: string): boolean {
    return (MEDIA_RULES.audioTypes as readonly string[]).includes(mime);
  }

  fileType(mime: string): 'image' | 'video' | 'audio' {
    return this.isAudio(mime) ? 'audio' : this.isVideo(mime) ? 'video' : 'image';
  }

  /** Tip va andozaro tekshirad; `image` — faqat aks, `media` — aks yo video, `chat` — + audio. */
  assertAllowed(file: Express.Multer.File, kind: UploadKind) {
    const isImage = (MEDIA_RULES.imageTypes as readonly string[]).includes(file.mimetype);
    const isVideo = this.isVideo(file.mimetype);
    const isAudio = this.isAudio(file.mimetype);
    const allowed = isImage || (kind !== 'image' && isVideo) || (kind === 'chat' && isAudio);
    if (!allowed) {
      throw new AppException(HttpStatus.BAD_REQUEST, ErrorCode.MEDIA_TYPE_NOT_ALLOWED);
    }
    const max = isVideo ? MEDIA_RULES.maxVideoBytes : isAudio ? MEDIA_RULES.maxAudioBytes : MEDIA_RULES.maxImageBytes;
    if (file.size > max) {
      throw new AppException(HttpStatus.BAD_REQUEST, ErrorCode.MEDIA_TOO_LARGE);
    }
  }

  async save(file: Express.Multer.File, kind: UploadKind): Promise<string> {
    this.assertAllowed(file, kind);
    await mkdir(this.root, { recursive: true });
    const id = randomUUID();
    // Aks (gayr az GIF-i animatsiyador) → WebP (Spec 03, `process-image`)
    if (file.mimetype.startsWith('image/') && file.mimetype !== 'image/gif') {
      const image = await this.saveImage(file.buffer, id);
      await this.backup([image, ...IMAGE_VARIANTS.map((w) => `${id}-${w}.webp`)]);
      return image;
    }
    const ext = EXT_BY_MIME[file.mimetype] ?? extname(file.originalname).toLowerCase();
    const fileName = `${id}${ext}`;
    await writeFile(join(this.root, fileName), file.buffer);
    await this.prisma.mediaFile.create({ data: { name: fileName, data: new Uint8Array(file.buffer) } });
    return fileName;
  }

  /**
   * Spec 03 `process-image` (sinxroni — Redis/queue nest): sharp magic bytes-ro mesanjad (agar fayl aks naboshad → 400),
   * EXIF-orientation-ro isloh va metadata-ro hazf mekunad, WebP 1080 va versiyahoi 640 / 320 mesozad.
   */
  private async saveImage(buffer: Buffer, id: string): Promise<string> {
    let image: Sharp;
    try {
      image = sharp(buffer, { failOn: 'error' }).rotate();
      await image.metadata();
    } catch {
      throw new AppException(HttpStatus.BAD_REQUEST, ErrorCode.MEDIA_TYPE_NOT_ALLOWED);
    }
    const fileName = `${id}.webp`;
    try {
      await Promise.all([
        image.clone().resize({ width: IMAGE_WIDTH, withoutEnlargement: true }).webp({ quality: WEBP_QUALITY }).toFile(join(this.root, fileName)),
        ...IMAGE_VARIANTS.map((w) =>
          image.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: WEBP_QUALITY }).toFile(join(this.root, `${id}-${w}.webp`)),
        ),
      ]);
    } catch {
      [fileName, ...IMAGE_VARIANTS.map((w) => `${id}-${w}.webp`)].forEach((f) => unlink(join(this.root, f)).catch(() => undefined));
      throw new AppException(HttpStatus.BAD_REQUEST, ErrorCode.MEDIA_TYPE_NOT_ALLOWED);
    }
    return fileName;
  }

  /** Hazf dar fon (bo versiyahoi WebP): xato ba user namerasad. */
  remove(fileName: string | null | undefined) {
    if (!fileName) return;
    const files = fileName.endsWith('.webp')
      ? [fileName, ...IMAGE_VARIANTS.map((w) => fileName.replace(/\.webp$/, `-${w}.webp`))]
      : [fileName];
    for (const f of files) {
      unlink(join(this.root, f)).catch((err: NodeJS.ErrnoException) => {
        if (err.code !== 'ENOENT') this.logger.warn(`Fayl hazf nashud: ${f} (${err.message})`);
      });
    }
    this.prisma.mediaFile
      .deleteMany({ where: { name: { in: files } } })
      .catch((err: Error) => this.logger.warn(`Fayl az DB hazf nashud: ${fileName} (${err.message})`));
  }
}
