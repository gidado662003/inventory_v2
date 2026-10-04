import { Request, Response, NextFunction } from "express";
import type { Role } from "../generated/prisma/enums";
import { AppError } from "../utils/AppError";
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      throw new AppError("Unauthorized", 401);
    }
    if (!allowedRoles.includes(user.role as Role)) {
      throw new AppError("You are not permitted to do this", 403);
    }
    next();
  };
};
