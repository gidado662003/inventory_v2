import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  name: z.string().min(1, "Name is required"),
  password: z.string().min(1, "Password is required"),
});

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const signupResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.string(),
});

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
});

export const refreshResponseSchema = z.object({
  accessToken: z.string(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type User = z.infer<typeof userSchema>;
export type SignupResponse = z.infer<typeof signupResponseSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
