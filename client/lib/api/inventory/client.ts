import { clientHttp } from "@/lib/api/http/client";
import {
  createMovementSchema,
  inventoryMovementSchema,
  movementsListQuerySchema,
  movementsListResponseSchema,
  type CreateMovementInput,
  type InventoryMovement,
  type MovementsListQuery,
  type MovementsListResponse,
} from "./schema";

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

export async function fetchMovements(
  query: MovementsListQuery = { page: 1, limit: 20 },
): Promise<MovementsListResponse> {
  const parsed = movementsListQuerySchema.parse(query);
  const { data } = await clientHttp.get(`/movements${buildQueryString(parsed)}`);
  return movementsListResponseSchema.parse(data);
}

export async function createMovement(
  input: CreateMovementInput,
): Promise<InventoryMovement> {
  const parsed = createMovementSchema.parse(input);
  const { data } = await clientHttp.post("/movements", parsed);
  return inventoryMovementSchema.parse(data);
}
