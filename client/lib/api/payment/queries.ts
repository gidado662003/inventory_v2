"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as paymentClient from "./client";
import type { CreatePaymentInput, PaymentsListQuery } from "./schema";

export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (filters: PaymentsListQuery) =>
    [...paymentKeys.lists(), filters] as const,
  bySale: (saleId: string) => [...paymentKeys.all, "sale", saleId] as const,
  byCustomer: (customerId: string) =>
    [...paymentKeys.all, "customer", customerId] as const,
};

export function usePayments(filters: PaymentsListQuery) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => paymentClient.fetchPayments(filters),
  });
}

export function usePaymentsForSale(saleId: string) {
  return useQuery({
    queryKey: paymentKeys.bySale(saleId),
    queryFn: () => paymentClient.fetchPaymentsForSale(saleId),
    enabled: !!saleId,
  });
}

export function usePaymentsForCustomer(customerId: string) {
  return useQuery({
    queryKey: paymentKeys.bySale(customerId),
    queryFn: () => paymentClient.fetchPaymentsByCustomer(customerId),
    enabled: !!customerId,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (input: CreatePaymentInput) =>
      paymentClient.createPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      router.refresh();
    },
  });
}
