import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { SignupInput, LoginInput } from "./auth.schema";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const generateAccessToken = (userId: string) =>
  jwt.sign({ sub: userId }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

const generateRefreshToken = () => crypto.randomBytes(64).toString("hex");

export const authService = {
  signup: async (data: SignupInput) => {
    const existing = await prisma.user.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new AppError("Name already taken", 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: { name: data.name, password: hashedPassword },
      select: { id: true, name: true, createdAt: true },
    });
  },

  login: async (data: LoginInput) => {
    const user = await prisma.user.findUnique({ where: { name: data.name } });
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const passwordMatches = await bcrypt.compare(data.password, user.password);
    if (!passwordMatches) {
      throw new AppError("Invalid credentials", 401);
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name },
    };
  },

  refresh: async (refreshToken: string | undefined) => {
    if (!refreshToken) {
      throw new AppError("No refresh token provided", 401);
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
    });

    if (
      !storedToken ||
      storedToken.revoked ||
      storedToken.expiresAt < new Date()
    ) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      }),
      prisma.refreshToken.create({
        data: {
          userId: storedToken.userId,
          tokenHash: hashToken(newRefreshToken),
          expiresAt,
        },
      }),
    ]);

    return {
      accessToken: generateAccessToken(storedToken.userId),
      refreshToken: newRefreshToken,
    };
  },

  logout: async (refreshToken: string | undefined) => {
    if (!refreshToken) return;
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken) },
      data: { revoked: true },
    });
  },
};
