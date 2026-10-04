import express from "express";
import movementController from "./movement.controller";
import { requireRole } from "../../middleware/roleHandler";
const movementRoutes = express.Router();

movementRoutes.post(
  "/",
  requireRole("ADMIN", "STAFF"),
  movementController.createMovement,
);
movementRoutes.get("/", movementController.getMovements);
movementRoutes.get("/totals", movementController.getMovementTotals);

movementRoutes.get(
  "/product/:productId",
  movementController.getMovementsByProduct,
);
movementRoutes.get(
  "/product/:productId/last-restock",
  movementController.getLastRestock,
);

export default movementRoutes;
