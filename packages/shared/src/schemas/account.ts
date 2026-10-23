import { z } from "zod";

export const RESERVED_USERNAMES = [
  "admin",
  "api",
  "explore",
  "reels",
  "direct",
  "stories",
  "accounts",
  "p",
  "login",
  "signup",
  "settings",
  "about",
  "live",
  "instants",
] as const;

export const USERNAME_REGEX = /^(?!.*\.\.)(?!\.)(?!.*\.$)[a-z0-9._]+$/;

export const userNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(30)
  .regex(USERNAME_REGEX, "Faqat a-z, 0-9, nuqta va _");

export const passwordSchema = z.string().min(8).max(64);

const passwordsMatch = { message: "Parolho mos nestand" };

export const registerSchema = z
  .object({
    userName: userNameSchema,
    fullName: z.string().trim().min(1).max(60),
    email: z.string().trim().toLowerCase().email().max(254),
    password: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .strict()
  .refine((v) => v.password === v.confirmPassword, {
    ...passwordsMatch,
    path: ["confirmPassword"],
  });
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    userName: z.string().trim().toLowerCase().min(1).max(30),
    password: z.string().min(1).max(64),
  })
  .strict();
export type LoginDto = z.infer<typeof loginSchema>;

export const forgotPasswordQuerySchema = z.object({
  Email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordQuerySchema = z
  .object({
    Token: z.string().min(1).max(200),
    Email: z.string().trim().toLowerCase().email(),
    Password: passwordSchema,
    ConfirmPassword: z.string().min(1),
  })
  .refine((v) => v.Password === v.ConfirmPassword, {
    ...passwordsMatch,
    path: ["ConfirmPassword"],
  });

export const changePasswordQuerySchema = z
  .object({
    OldPassword: z.string().min(1).max(64),
    Password: passwordSchema,
    ConfirmPassword: z.string().min(1),
  })
  .refine((v) => v.Password === v.ConfirmPassword, {
    ...passwordsMatch,
    path: ["ConfirmPassword"],
  });

/** data-i javobi login — JWT */
export const loginResponseDataSchema = z.string();

/** Public username check; registration still enforces uniqueness atomically. */
export const usernameAvailabilityQuerySchema = z
  .object({ UserName: userNameSchema })
  .strict();
export const usernameAvailabilitySchema = z.object({
  available: z.boolean(),
  reason: z.enum(["TAKEN", "RESERVED"]).optional(),
});
