import "server-only";

import { serverGet } from "@/lib/api/http/server";
import { movementsListResponseSchema } from "./schema";
import type { MovementsListQuery } from "./schema";

function buildQueryString(query: MovementsListQuery): string {
  const params = new URLSearchParams();
  if (query.productId) params.set("productId", query.productId);
  if (query.type) params.set("type", query.type);
  if (query.startDate) params.set("startDate", query.startDate);
  if (query.endDate) params.set("endDate", query.endDate);
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function getMovements(
  query: MovementsListQuery = { page: 1, limit: 20 },
) {
  const data = await serverGet<unknown>(`movements${buildQueryString(query)}`, {
    next: {
      tags: ["inventory"],
    },
  });
  return movementsListResponseSchema.parse(data);
}
