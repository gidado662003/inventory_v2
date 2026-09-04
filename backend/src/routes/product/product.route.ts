import express from "express";
import productController from "./product.controller";
const productRoutes = express.Router();

productRoutes.post("/", productController.createProduct);
productRoutes.get("/", productController.getProducts);
productRoutes.get("/:productId", productController.getProductById);
productRoutes.put("/:productId", productController.updateProduct);
export default productRoutes;
