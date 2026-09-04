import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;

export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as { sub: string };
    req.user = { id: payload.sub };
    next();
  } catch {
    next(new AppError("Unauthorized", 401));
  }
};
