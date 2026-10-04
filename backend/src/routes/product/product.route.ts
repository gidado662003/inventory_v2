import express from "express";
import productController from "./product.controller";
import { requireRole } from "../../middleware/roleHandler";
const productRoutes = express.Router();

productRoutes.post("/", requireRole("ADMIN"), productController.createProduct);
productRoutes.get("/", productController.getProducts);
productRoutes.get("/:productId", productController.getProductById);
productRoutes.put(
  "/:productId",
  requireRole("ADMIN"),
  productController.updateProduct,
);
export default productRoutes;
