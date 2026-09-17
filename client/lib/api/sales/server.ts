import "server-only";

import { serverGet } from "@/lib/api/http/server";
import type { SalesListQuery } from "./schema";
import {
  saleSchema,
  salesListResponseSchema,
  salesSummarySchema,
  salesItemListResponseSchema,
} from "./schema";
function buildQueryString(query: SalesListQuery): string {
  const params = new URLSearchParams();
  if (query.startDate) params.set("startDate", query.startDate);
  if (query.endDate) params.set("endDate", query.endDate);
  if (query.status) params.set("status", query.status);
  if (query.customerId) params.set("customerId", query.customerId);
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function getSales(query: SalesListQuery = { page: 1, limit: 20 }) {
  const data = await serverGet<unknown>(`sales${buildQueryString(query)}`, {
    next: {
      tags: ["sales"],
    },
  });
  return salesListResponseSchema.parse(data);
}

export async function getSalesItems(
  query: SalesListQuery = { page: 1, limit: 20 },
) {
  const data = await serverGet<unknown>(
    `sales/items${buildQueryString(query)}`,
    {
      next: {
        tags: ["salesItems"],
      },
    },
  );
  return salesItemListResponseSchema.parse(data);
}

export async function getSale(id: string) {
  const data = await serverGet<unknown>(`sales/${id}`, {
    next: {
      tags: ["sales", id],
    },
  });
  return saleSchema.parse(data);
}

export async function getSalesSummary(date?: string) {
  const qs = date ? `?date=${encodeURIComponent(date)}` : "";
  const data = await serverGet<unknown>(`sales/summary${qs}`, {
    next: {
      tags: ["sales", "summary"],
    },
  });
  return salesSummarySchema.parse(data);
}
