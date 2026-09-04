import { clientHttp } from "@/lib/api/http/client";
import {
  createCustomerSchema,
  customerDetailSchema,
  customerSchema,
  updateCustomerSchema,
  type CreateCustomerInput,
  type Customer,
  type CustomerDetail,
  type UpdateCustomerInput,
} from "./schema";
import { z } from "zod";

export async function fetchCustomers(): Promise<Customer[]> {
  const { data } = await clientHttp.get("/customer");
  return z.array(customerSchema).parse(data);
}

export async function fetchCustomer(id: string): Promise<CustomerDetail> {
  const { data } = await clientHttp.get(`/customer/${id}`);
  return customerDetailSchema.parse(data);
}

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<Customer> {
  const parsed = createCustomerSchema.parse(input);
  const { data } = await clientHttp.post("/customer", parsed);
  return customerSchema.parse(data);
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
): Promise<Customer> {
  const parsed = updateCustomerSchema.parse(input);
  const { data } = await clientHttp.put(`/customer/${id}`, parsed);
  return customerSchema.parse(data);
}
