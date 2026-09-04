import express from "express";
import { dashboardController } from "./dashboard.controller";

const dashboardRoutes = express.Router();

dashboardRoutes.get("/summary", dashboardController.getSummary);

export default dashboardRoutes;
