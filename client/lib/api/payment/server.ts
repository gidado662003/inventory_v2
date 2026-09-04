import "server-only";

import { serverGet } from "@/lib/api/http/server";
import { paymentSchema, paymentsListResponseSchema } from "./schema";
import type { PaymentsListQuery } from "./schema";
import { z } from "zod";

function buildQueryString(query: PaymentsListQuery): string {
  const params = new URLSearchParams();
  if (query.saleId) params.set("saleId", query.saleId);
  if (query.customerId) params.set("customerId", query.customerId);
  if (query.startDate) params.set("startDate", query.startDate);
  if (query.endDate) params.set("endDate", query.endDate);
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function getPayments(
  query: PaymentsListQuery = { page: 1, limit: 20 },
) {
  const data = await serverGet<unknown>(`payment${buildQueryString(query)}`, {
    next: {
      tags: ["payments"],
    },
  });
  return paymentsListResponseSchema.parse(data);
}

export async function getPaymentsForSale(saleId: string) {
  const data = await serverGet<unknown>(`payment/sale/${saleId}`, {
    next: {
      tags: ["payments", saleId],
    },
  });
  return z.array(paymentSchema).parse(data);
}

export async function getPaymentsByCustomer(customerId: string) {
  const data = await serverGet<unknown>(`payment/customer/${customerId}`, {
    next: {
      tags: ["payments", "customer", customerId],
    },
  });
  return z.array(paymentSchema).parse(data);
}
