"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as authClient from "./client";
import type { LoginInput, SignupInput } from "./schema";

export const authKeys = {
  all: ["auth"] as const,
};

export function useLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: LoginInput) => authClient.login(input),
    onSuccess: () => {
      router.push("/sales");
      router.refresh();
    },
  });
}

export function useSignup() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: SignupInput) => authClient.signup(input),
    onSuccess: () => {
      router.push("/login");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  return useMutation({
    mutationFn: () => authClient.logout(),
    onSuccess: () => {
      router.push("/login");
      router.refresh();
    },
  });
}
