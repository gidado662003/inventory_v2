import express from "express";
import { authController } from "./auth.controller";

const authRoutes = express.Router();

authRoutes.post("/signup", authController.signup);
authRoutes.post("/login", authController.login);
authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/logout", authController.logout);

export default authRoutes;
