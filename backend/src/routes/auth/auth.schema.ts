import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  name: z.string(),
  password: z.string(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
