import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { signupSchema, loginSchema } from "./auth.schema";
import { AppError } from "../../utils/AppError";

const REFRESH_COOKIE_NAME = "refreshToken";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const authController = {
  signup: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, success } = signupSchema.safeParse(req.body);
      if (!success) throw new AppError("Invalid signup data", 400);

      const user = await authService.signup(data);
      res.status(201).json({ success: true, response: user });
    } catch (error) {
      next(error);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, success } = loginSchema.safeParse(req.body);
      if (!success) throw new AppError("Invalid login data", 400);

      const { accessToken, refreshToken, user } = await authService.login(data);
      res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);
      res.status(200).json({ success: true, response: { accessToken, user } });
    } catch (error) {
      next(error);
    }
  },

  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accessToken, refreshToken } = await authService.refresh(
        req.cookies?.[REFRESH_COOKIE_NAME],
      );
      res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);
      res.status(200).json({ success: true, response: { accessToken } });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.logout(req.cookies?.[REFRESH_COOKIE_NAME]);
      res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
      res.status(200).json({ success: true, response: null });
    } catch (error) {
      next(error);
    }
  },
};
