"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as inventoryClient from "./client";
import type { CreateMovementInput, MovementsListQuery } from "./schema";

export const inventoryKeys = {
  all: ["inventory"] as const,
  lists: () => [...inventoryKeys.all, "list"] as const,
  list: (filters: MovementsListQuery) =>
    [...inventoryKeys.lists(), filters] as const,
};

export function useMovements(filters: MovementsListQuery) {
  return useQuery({
    queryKey: inventoryKeys.list(filters),
    queryFn: () => inventoryClient.fetchMovements(filters),
  });
}

export function useCreateMovement() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (input: CreateMovementInput) =>
      inventoryClient.createMovement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      router.refresh();
    },
  });
}
