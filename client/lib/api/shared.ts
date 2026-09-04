import { z } from "zod";

export const decimalSchema = z
  .union([z.number(), z.string()])
  .transform((value) => Number(value));

export const dateTimeSchema = z.union([z.string(), z.date()]).transform((value) =>
  value instanceof Date ? value.toISOString() : value,
);

export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export type Pagination = z.infer<typeof paginationSchema>;
