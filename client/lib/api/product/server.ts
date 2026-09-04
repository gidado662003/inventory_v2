import "server-only";

import { serverGet } from "@/lib/api/http/server";
import { productSchema } from "./schema";
import { z } from "zod";

export async function getProducts() {
  const data = await serverGet<unknown>("product", {
    next: { tags: ["products"] },
  });
  return z.array(productSchema).parse(data);
}

export async function getProduct(id: string) {
  const data = await serverGet<unknown>(`product/${id}`, {
    next: {
      tags: ["products", id],
    },
  });
  return productSchema.parse(data);
}
