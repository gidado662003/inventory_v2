import z from "zod";

export const customerSchema = z.object({
  name: z.string().toLowerCase(),
  phone: z.string().optional(),
});

export const updateSchema = z.object({
  name: z.string().toLowerCase().optional(),
  phone: z.string().optional().optional(),
  isActive: z.boolean().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerUpdateInput = z.infer<typeof updateSchema>;
