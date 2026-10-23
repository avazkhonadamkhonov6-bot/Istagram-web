import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ErrorCode, LoginDto, RESERVED_USERNAMES, RegisterDto } from '@repo/shared';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { AppException, badRequest, conflict } from '../../common/app-exception';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { MailService } from '../../infra/mail.service';
import { PrismaService, isUniqueViolation } from '../../infra/prisma.service';

/** argon2id: memoryCost 19 MB, timeCost 2 (TZ §6.1) */
const ARGON_OPTIONS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2 } as const;
const RESET_TTL_MS = 15 * 60 * 1000;

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);
  /** Hash-i "dummy" baroi login bo useri nomavjud — himoya az timing attack */
  private dummyHash: Promise<string> = argon2.hash('dummy-password-for-timing', ARGON_OPTIONS);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  hashPassword(password: string) {
    return argon2.hash(password, ARGON_OPTIONS);
  }

  /** Qoidahoi username-i yakxela (TZ §3): reserved → 400, band → 409. Baroi ivazi username ham. */
  async assertUserNameFree(userName: string, exceptUserId?: string) {
    if ((RESERVED_USERNAMES as readonly string[]).includes(userName)) throw badRequest(ErrorCode.USERNAME_RESERVED);
    const existing = await this.prisma.user.findUnique({ where: { userName }, select: { id: true } });
    if (existing && existing.id !== exceptUserId) throw conflict(ErrorCode.USERNAME_TAKEN);
  }

  async register(dto: RegisterDto) {
    await this.assertUserNameFree(dto.userName);
    const emailTaken = await this.prisma.user.findUnique({ where: { email: dto.email }, select: { id: true } });
    if (emailTaken) throw conflict(ErrorCode.EMAIL_TAKEN);

    const passwordHash = await this.hashPassword(dto.password);
    try {
      await this.prisma.user.create({
        data: { userName: dto.userName, email: dto.email, fullName: dto.fullName, passwordHash },
        select: { id: true },
      });
    } catch (err) {
      // Du darxosti parallel (Spec 01 AC3)
      if (isUniqueViolation(err)) {
        const target = String((err as { meta?: { target?: unknown } }).meta?.target ?? '');
        throw conflict(target.includes('email') ? ErrorCode.EMAIL_TAKEN : ErrorCode.USERNAME_TAKEN);
      }
      throw err;
    }
    return 'User registered';
  }

  async login(dto: LoginDto): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { userName: dto.userName },
      select: { id: true, userName: true, passwordHash: true },
    });
    const valid = await argon2.verify(user?.passwordHash ?? (await this.dummyHash), dto.password);
    if (!user || !valid) throw new AppException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS);
    return this.signToken(user.id, user.userName);
  }

  signToken(id: string, userName: string) {
    const payload: JwtPayload = { sub: id, name: userName };
    return this.jwt.signAsync(payload);
  }

  /** JWT-i 60 soniya baroi ulanishi Socket.IO (Spec 01) */
  signWsTicket(id: string, userName: string) {
    const payload: JwtPayload = { sub: id, name: userName, typ: 'ws' };
    return this.jwt.signAsync(payload, { expiresIn: 60 });
  }

  /** Kod sohta meshavad; to ilovai e-mail (P2) dar log-i dev nishon doda meshavad. */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    // Javob yakxela ast — az ruyi on fahmidan nashavad ki e-mail hast yo ne
    if (user) {
      const code = randomBytes(4).toString('hex');
      await this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: sha256(code), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
      });
      const sent = await this.mail.send(
        email,
        `${code} — kodi ivazi parol`,
        `Kodi shumo baroi ivazi paroli Instagram: ${code}\n\nKod 15 daqiqa amal mekunad. Agar shumo darxost nakarded, in xatro nodida gired.`,
      );
      if (!sent && process.env.NODE_ENV !== 'production') this.logger.log(`Kodi ivazi parol baroi ${email}: ${code}`);
    }
    return 'Code sent';
  }

  async resetPassword(email: string, token: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    const record = user
      ? await this.prisma.passwordResetToken.findFirst({
          where: { userId: user.id, tokenHash: sha256(token), usedAt: null, expiresAt: { gt: new Date() } },
        })
      : null;
    if (!user || !record) throw badRequest(ErrorCode.INVALID_RESET_TOKEN);

    const passwordHash = await this.hashPassword(password);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      this.prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    ]);
    return 'Password reset';
  }

  async changePassword(userId: string, oldPassword: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    if (!user || !(await argon2.verify(user.passwordHash, oldPassword))) throw badRequest(ErrorCode.WRONG_PASSWORD);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await this.hashPassword(password) } });
    return 'Password changed';
  }
}
