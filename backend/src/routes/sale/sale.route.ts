import express from "express";
import { salesController } from "./sale.controller";
const saleRoutes = express.Router();

saleRoutes.post("/", salesController.createSales);
saleRoutes.get("/", salesController.getSales);
saleRoutes.get("/items", salesController.getSalesItems);
saleRoutes.get("/summary", salesController.getSalesSummary);
saleRoutes.get("/:id", salesController.getSalesById);
saleRoutes.put("/:id/items", salesController.editSaleItems);
export default saleRoutes;
