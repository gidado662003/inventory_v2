import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).toLowerCase(),
  price: z.number().nonnegative(),
  stockQuantity: z.number().int().nonnegative(),
  isActive: z.boolean().default(true),
  aliases: z.array(z.string().toLowerCase()).optional(),
});
export const productAliases = z.object({
  name: z.array(z.string().toLowerCase()),
  productId: z.uuid(),
});
export const updateProduct = z.object({
  name: z.string().min(1).toLowerCase().optional(),
  price: z.number().nonnegative().optional(),
  isActive: z.boolean().default(true).optional(),
  aliases: z.array(z.string()).optional(),
});
export type ProductAliasesInput = z.infer<typeof productAliases>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type updateProductInput = z.infer<typeof updateProduct>;
