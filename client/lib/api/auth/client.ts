import { clientHttp } from "@/lib/api/http/client";

import {
  loginResponseSchema,
  loginSchema,
  refreshResponseSchema,
  signupResponseSchema,
  signupSchema,
  type LoginInput,
  type LoginResponse,
  type SignupInput,
  type SignupResponse,
} from "./schema";

import {
  setAccessTokenCookie,
  clearAccessTokenCookie,
} from "@/lib/api/http/cookies";

export async function login(input: LoginInput): Promise<LoginResponse> {
  const parsed = loginSchema.parse(input);

  const { data } = await clientHttp.post("/auth/login", parsed);

  const response = loginResponseSchema.parse(data);

  setAccessTokenCookie(response.accessToken);

  return response;
}

export async function signup(input: SignupInput): Promise<SignupResponse> {
  const parsed = signupSchema.parse(input);

  const { data } = await clientHttp.post("/auth/signup", parsed);

  return signupResponseSchema.parse(data);
}

export async function logout(): Promise<void> {
  try {
    await clientHttp.post("/auth/logout");
  } finally {
    clearAccessTokenCookie();
  }
}

export async function refreshToken(): Promise<string> {
  const { data } = await clientHttp.post("/auth/refresh");

  const response = refreshResponseSchema.parse(data);

  setAccessTokenCookie(response.accessToken);

  return response.accessToken;
}
