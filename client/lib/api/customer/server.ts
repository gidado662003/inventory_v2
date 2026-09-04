import "server-only";

import { serverGet } from "@/lib/api/http/server";
import { customerDetailSchema, customerSchema } from "./schema";
import { z } from "zod";

export async function getCustomers() {
  const data = await serverGet<unknown>("customer", {
    next: { tags: ["customers"] },
  });
  return z.array(customerSchema).parse(data);
}

export async function getCustomer(id: string) {
  const data = await serverGet<unknown>(`customer/${id}`, {
    next: {
      tags: ["customers", id],
    },
  });
  return customerDetailSchema.parse(data);
}
