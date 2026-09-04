import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import {
  createProductSchema,
  productAliases,
  updateProduct,
} from "./product.schema";
import { AppError } from "../../utils/AppError";
import productService from "./product.service";
const productController = {
  createProduct: catchAsync(async (req: Request, res: Response) => {
    const { data, success } = createProductSchema.safeParse(req.body);

    if (!success) {
      throw new AppError("bad request", 400);
    }
    const response = await productService.createProduct(data);
    res.status(201).json({ success: true, response });
  }),

  getProducts: catchAsync(async (req, res) => {
    const response = await productService.getProduct();
    res.status(200).json({ success: true, response });
  }),
  getProductById: catchAsync(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const response = await productService.getProductById(productId);
    res.status(200).json({ success: true, response });
  }),
  updateProduct: catchAsync(async (req, res) => {
    const productId = req.params.productId as string;
    const { data, success } = updateProduct.safeParse(req.body);
    if (!success) {
      throw new AppError("bad request", 400);
    }
    const response = await productService.updateProduct(productId, data);
    res.status(200).json({ success: true, response });
  }),
};

export default productController;
