import { clientHttp } from "@/lib/api/http/client";
import {
  createProductSchema,
  productSchema,
  updateProductSchema,
  type CreateProductInput,
  type Product,
  type UpdateProductInput,
} from "./schema";
import { z } from "zod";

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await clientHttp.get("/product");
  return z.array(productSchema).parse(data);
}

export async function fetchProduct(id: string): Promise<Product> {
  const { data } = await clientHttp.get(`/product/${id}`);
  return productSchema.parse(data);
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const parsed = createProductSchema.parse(input);
  const { data } = await clientHttp.post("/product", parsed);
  return productSchema.parse(data);
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<Product> {
  const parsed = updateProductSchema.parse(input);
  const { data } = await clientHttp.put(`/product/${id}`, parsed);
  return productSchema.parse(data);
}
