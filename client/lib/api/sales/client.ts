import { clientHttp } from "@/lib/api/http/client";
import {
  createSaleResponseSchema,
  createSaleSchema,
  editSaleItemSchema,
  saleSchema,
  salesListQuerySchema,
  salesListResponseSchema,
  type CreateSaleInput,
  type EditSaleItemInput,
  type Sale,
  type SalesListQuery,
  type SalesListResponse,
} from "./schema";
import { z } from "zod";

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

export async function fetchSales(
  query: SalesListQuery = { page: 1, limit: 20 },
): Promise<SalesListResponse> {
  const parsed = salesListQuerySchema.parse(query);
  const { data } = await clientHttp.get(`/sales${buildQueryString(parsed)}`);
  return salesListResponseSchema.parse(data);
}

export async function fetchSale(id: string): Promise<Sale> {
  const { data } = await clientHttp.get(`/sales/${id}`);
  return saleSchema.parse(data);
}

export async function createSale(input: CreateSaleInput) {
  const parsed = createSaleSchema.parse(input);
  const { data } = await clientHttp.post("/sales", parsed);
  return createSaleResponseSchema.parse(data);
}

export async function editSaleItems(
  saleId: string,
  items: EditSaleItemInput[],
) {
  const parsed = z.array(editSaleItemSchema).parse(items);
  const { data } = await clientHttp.put(`/sales/${saleId}/items`, parsed);
  return saleSchema.parse(data);
}
