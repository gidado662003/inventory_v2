import express from "express";
import { authController } from "./auth.controller";
import { requireAuth } from "../../middleware/requireAuth";
const authRoutes = express.Router();

authRoutes.get("/me", requireAuth, authController.me);
authRoutes.post("/signup", authController.signup);
authRoutes.post("/login", authController.login);
authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/logout", authController.logout);

export default authRoutes;
