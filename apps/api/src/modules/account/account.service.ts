import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  ErrorCode,
  LoginDto,
  RESERVED_USERNAMES,
  RegisterDto,
} from "@repo/shared";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { AppException, badRequest, conflict } from "../../common/app-exception";
import { JwtPayload } from "../../common/guards/jwt-auth.guard";
import { MailService } from "../../infra/mail.service";
import { PrismaService, isUniqueViolation } from "../../infra/prisma.service";

/** argon2id: memoryCost 19 MB, timeCost 2 (TZ §6.1) */
const ARGON_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
} as const;
const RESET_TTL_MS = 15 * 60 * 1000;

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

/** Xati HTML-i kodi ivazi parol (code — faqat [0-9a-f], escape lozim nest) */
const resetEmailHtml = (code: string) => `<!doctype html>
<html><body style="margin:0;padding:24px;background:#fafafa;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#262626">
  <div style="max-width:420px;margin:0 auto;background:#fff;border:1px solid #dbdbdb;border-radius:8px;padding:32px;text-align:center">
    <div style="font-size:28px;font-family:Georgia,serif;margin-bottom:16px">Instagram</div>
    <p style="margin:0 0 16px">Kodi shumo baroi ivazi parol:</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:6px;padding:12px 0;font-family:Menlo,Consolas,monospace">${code}</div>
    <p style="margin:16px 0 0;font-size:13px;color:#737373">Kod 15 daqiqa amal mekunad. Agar shumo darxost nakarded, in xatro nodida gired.</p>
  </div>
</body></html>`;

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);
  /** Hash-i "dummy" baroi login bo useri nomavjud — himoya az timing attack */
  private dummyHash: Promise<string> = argon2.hash(
    "dummy-password-for-timing",
    ARGON_OPTIONS,
  );

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
    if ((RESERVED_USERNAMES as readonly string[]).includes(userName))
      throw badRequest(ErrorCode.USERNAME_RESERVED);
    const existing = await this.prisma.user.findUnique({
      where: { userName },
      select: { id: true },
    });
    if (existing && existing.id !== exceptUserId)
      throw conflict(ErrorCode.USERNAME_TAKEN);
  }

  async usernameAvailable(userName: string) {
    if ((RESERVED_USERNAMES as readonly string[]).includes(userName))
      return { available: false, reason: "RESERVED" as const };
    const user = await this.prisma.user.findUnique({
      where: { userName },
      select: { id: true },
    });
    return user
      ? { available: false, reason: "TAKEN" as const }
      : { available: true };
  }

  async register(dto: RegisterDto) {
    await this.assertUserNameFree(dto.userName);
    const emailTaken = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (emailTaken) throw conflict(ErrorCode.EMAIL_TAKEN);

    const passwordHash = await this.hashPassword(dto.password);
    try {
      await this.prisma.user.create({
        data: {
          userName: dto.userName,
          email: dto.email,
          fullName: dto.fullName,
          passwordHash,
        },
        select: { id: true },
      });
    } catch (err) {
      // Du darxosti parallel (Spec 01 AC3)
      if (isUniqueViolation(err)) {
        const target = String(
          (err as { meta?: { target?: unknown } }).meta?.target ?? "",
        );
        throw conflict(
          target.includes("email")
            ? ErrorCode.EMAIL_TAKEN
            : ErrorCode.USERNAME_TAKEN,
        );
      }
      throw err;
    }
    return "User registered";
  }

  async login(dto: LoginDto): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { userName: dto.userName },
      select: { id: true, userName: true, passwordHash: true },
    });
    const valid = await argon2.verify(
      user?.passwordHash ?? (await this.dummyHash),
      dto.password,
    );
    if (!user || !valid)
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS,
      );
    return this.signToken(user.id, user.userName);
  }

  signToken(id: string, userName: string) {
    const payload: JwtPayload = { sub: id, name: userName };
    return this.jwt.signAsync(payload);
  }

  /** JWT-i 60 soniya baroi ulanishi Socket.IO (Spec 01) */
  signWsTicket(id: string, userName: string) {
    const payload: JwtPayload = { sub: id, name: userName, typ: "ws" };
    return this.jwt.signAsync(payload, { expiresIn: 60 });
  }

  /** Kod sohta meshavad; to ilovai e-mail (P2) dar log-i dev nishon doda meshavad. */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    // Javob yakxela ast — az ruyi on fahmidan nashavad ki e-mail hast yo ne
    if (user) {
      const code = randomBytes(4).toString("hex");
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: sha256(code),
          expiresAt: new Date(Date.now() + RESET_TTL_MS),
        },
      });
      // Dar fon: javob foran meravad va az vaqti javob fahmida nameshavad, ki e-mail hast
      void this.mail
        .send({
          to: email,
          subject: `${code} — kodi ivazi parol`,
          text: `Kodi shumo baroi ivazi paroli Instagram: ${code}\n\nKod 15 daqiqa amal mekunad. Agar shumo darxost nakarded, in xatro nodida gired.`,
          html: resetEmailHtml(code),
        })
        .then((sent) => {
          if (!sent && process.env.NODE_ENV !== "production")
            this.logger.log(`Kodi ivazi parol baroi ${email}: ${code}`);
          else if (!sent) this.logger.warn("Kodi ivazi parol firistoda nashud (docs/EMAIL.md)");
        });
    }
    return "Code sent";
  }

  async resetPassword(email: string, token: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    const record = user
      ? await this.prisma.passwordResetToken.findFirst({
          where: {
            userId: user.id,
            tokenHash: sha256(token),
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
        })
      : null;
    if (!user || !record) throw badRequest(ErrorCode.INVALID_RESET_TOKEN);

    const passwordHash = await this.hashPassword(password);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);
    return "Password reset";
  }

  async changePassword(userId: string, oldPassword: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user || !(await argon2.verify(user.passwordHash, oldPassword)))
      throw badRequest(ErrorCode.WRONG_PASSWORD);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await this.hashPassword(password) },
    });
    return "Password changed";
  }
}
