import { clientHttp } from "@/lib/api/http/client";
import {
  createPaymentSchema,
  paymentSchema,
  paymentsListQuerySchema,
  paymentsListResponseSchema,
  type CreatePaymentInput,
  type Payment,
  type PaymentsListQuery,
  type PaymentsListResponse,
} from "./schema";
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

export async function fetchPayments(
  query: PaymentsListQuery = { page: 1, limit: 20 },
): Promise<PaymentsListResponse> {
  const parsed = paymentsListQuerySchema.parse(query);
  const { data } = await clientHttp.get(`/payment${buildQueryString(parsed)}`);
  return paymentsListResponseSchema.parse(data);
}

export async function fetchPaymentsForSale(saleId: string): Promise<Payment[]> {
  const { data } = await clientHttp.get(`/payment/sale/${saleId}`);
  return z.array(paymentSchema).parse(data);
}

export async function fetchPaymentsByCustomer(
  customerId: string,
): Promise<Payment[]> {
  const { data } = await clientHttp.get(`/payment/customer/${customerId}`);
  return z.array(paymentSchema).parse(data);
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const parsed = createPaymentSchema.parse(input);
  const { data } = await clientHttp.post("/payment", parsed);
  return paymentSchema.parse(data);
}
