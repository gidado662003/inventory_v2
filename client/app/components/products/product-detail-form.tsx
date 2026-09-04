"use client";
import { useState } from "react";
import {
  Package,
  Tag,
  Boxes,
  Pencil,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useUpdateProduct } from "@/lib/api/product/queries";
import { updateProductSchema, type Product } from "@/lib/api/product/schema";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
export function ProductDetailForm({ product }: { product: Product }) {
  const updateProduct = useUpdateProduct(product.id);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    const result = updateProductSchema.safeParse({
      name,
      price: Number(price),
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }
    updateProduct.mutate(result.data);
  }
  const isActive = product.isActive;
  const aliases = product.aliases ?? [];
  return (
    <div className=" w-full  space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted/40">
            <Package className="size-6 text-muted-foreground" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {product.name}
              </h1>
              <Badge
                variant={isActive ? "success" : "default"}
                className="gap-1"
              >
                {isActive ? (
                  <CheckCircle2 className="size-3" />
                ) : (
                  <XCircle className="size-3" />
                )}
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Product details and inventory information
            </p>
          </div>
        </div>
      </div>
      {/* Overview */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">
            Current product information
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Price */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Tag className="size-4 text-emerald-600" />
              </div>
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Selling Price
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatCurrency(product.price)}
            </p>
          </Card>
          {/* Stock */}
          <Card className="p-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
              <Boxes className="size-4 text-blue-600" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current Stock
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {product.stockQuantity}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                units
              </span>
            </p>
          </Card>
          {/* Aliases */}
          <Card className="p-5 sm:col-span-2 lg:col-span-1">
            <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10">
              <Tag className="size-4 text-purple-600" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Aliases
            </p>
            {aliases.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {aliases.map((alias) => (
                  <span
                    key={alias.id}
                    className="rounded-md bg-muted px-2 py-1 text-xs font-medium"
                  >
                    {alias.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground"> No aliases </p>
            )}
          </Card>
        </div>
      </section>
      {/* Edit */}
      <Card className="overflow-hidden">
        <div className="border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <Pencil className="size-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold"> Edit product </h2>
              <p className="text-xs text-muted-foreground">
                Update the product's basic information
              </p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={fieldErrors.name}
            />
            <Input
              label="Price"
              variant="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              error={fieldErrors.price}
            />
          </div>
          {updateProduct.isError && (
            <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2.5">
              <p className="text-sm text-danger">
                {updateProduct.error.message}
              </p>
            </div>
          )}
          {updateProduct.isSuccess && (
            <div className="rounded-lg border border-success/20 bg-success/5 px-3 py-2.5">
              <p className="text-sm text-success">
                Product updated successfully.
              </p>
            </div>
          )}
          <div className="flex justify-end border-t pt-5">
            <Button type="submit" disabled={updateProduct.isPending}>
              {updateProduct.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
