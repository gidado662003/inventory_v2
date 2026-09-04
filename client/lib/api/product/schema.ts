import { z } from "zod";
import { dateTimeSchema, decimalSchema } from "@/lib/api/shared";

export const productAliasSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  productId: z.string().uuid(),
  createdAt: dateTimeSchema.optional(),
});

export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: decimalSchema,
  stockQuantity: z.number(),
  isActive: z.boolean(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  aliases: z.array(productAliasSchema).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().nonnegative("Price must be non-negative"),
  stockQuantity: z.number().int().nonnegative("Stock must be non-negative"),
  isActive: z.boolean().default(true),
  aliases: z.array(z.string()).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
  aliases: z.array(z.string()).optional(),
});

export type Product = z.infer<typeof productSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
