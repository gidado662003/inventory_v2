"use client";

import { useState } from "react";
import { useCreateMovement } from "@/lib/api/inventory/queries";
import { useProducts } from "@/lib/api/product/queries";
import { createMovementSchema } from "@/lib/api/inventory/schema";
import type { MovementsListResponse } from "@/lib/api/inventory/schema";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Modal } from "@/app/components/ui/modal";
import { Badge } from "@/app/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/app/components/ui/table";
import { formatDate } from "@/lib/utils/format";

function CreateMovementModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createMovement = useCreateMovement();
  const { data: products = [] } = useProducts();
  const [productId, setProductId] = useState("");
  const [type, setType] = useState<"RESTOCK" | "ADJUSTMENT" | "INITIAL_STOCK">(
    "RESTOCK",
  );
  const [quantity, setQuantity] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = createMovementSchema.safeParse({
      productId,
      type,
      quantity: Number(quantity),
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    createMovement.mutate(result.data, { onSuccess: onClose });
  }

  return (
    <Modal open={open} onClose={onClose} title="Record movement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Product</label>
          <select
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {fieldErrors.productId && (
            <p className="mt-1 text-xs text-danger">{fieldErrors.productId}</p>
          )}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Type</label>
          <select
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
            value={type}
            onChange={(e) =>
              setType(
                e.target.value as "RESTOCK" | "ADJUSTMENT" | "INITIAL_STOCK",
              )
            }
          >
            <option value="RESTOCK">Restock</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="INITIAL_STOCK">Initial stock</option>
          </select>
        </div>
        <Input
          label="Quantity"
          type="text"
          inputMode="numeric"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          error={fieldErrors.quantity}
        />
        {createMovement.isError && (
          <p className="text-sm text-danger">{createMovement.error.message}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMovement.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const typeVariant = {
  SALE: "success",
  RESTOCK: "success",
  RETURN: "warning",
  ADJUSTMENT: "default",
  INITIAL_STOCK: "default",
} as const;

export function InventoryListView({ data }: { data: MovementsListResponse }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-muted-foreground">Stock movement log</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Record movement</Button>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Date</TH>
            <TH>Product</TH>
            <TH>Type</TH>
            <TH>Quantity</TH>
          </TR>
        </THead>
        <TBody>
          {data.movements.map((movement) => (
            <TR key={movement.id}>
              <TD>{formatDate(movement.createdAt)}</TD>
              <TD>{movement.product?.name ?? movement.productId}</TD>
              <TD>
                <Badge variant={typeVariant[movement.type] ?? "default"}>
                  {movement.type}
                </Badge>
              </TD>
              <TD>{movement.quantity}</TD>
            </TR>
          ))}
        </TBody>
      </Table>

      <CreateMovementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
