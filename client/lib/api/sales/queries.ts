"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as salesClient from "./client";
import type {
  CreateSaleInput,
  EditSaleItemInput,
  SalesListQuery,
} from "./schema";

export const salesKeys = {
  all: ["sales"] as const,
  lists: () => [...salesKeys.all, "list"] as const,
  list: (filters: SalesListQuery) => [...salesKeys.lists(), filters] as const,
  details: () => [...salesKeys.all, "detail"] as const,
  detail: (id: string) => [...salesKeys.details(), id] as const,
};

export function useSales(filters: SalesListQuery) {
  return useQuery({
    queryKey: salesKeys.list(filters),
    queryFn: () => salesClient.fetchSales(filters),
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: salesKeys.detail(id),
    queryFn: () => salesClient.fetchSale(id),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (input: CreateSaleInput) => salesClient.createSale(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      router.refresh();
    },
  });
}

export function useEditSaleItems(saleId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (items: EditSaleItemInput[]) =>
      salesClient.editSaleItems(saleId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      router.refresh();
    },
  });
}
