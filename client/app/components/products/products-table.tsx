"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/api/product/schema";
import { ProductFormModal } from "@/app/components/products/product-form-modal";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/app/components/ui/table";
import { formatCurrency } from "@/lib/utils/format";

export function ProductsTable({ products }: { products: Product[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-muted">{products.length} items</p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setModalOpen(true);
          }}
        >
          Add product
        </Button>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>Price</TH>
            <TH>Stock</TH>
            <TH>Status</TH>
            <TH />
          </TR>
        </THead>
        <TBody>
          {products.map((product) => (
            <TR key={product.id}>
              <TD>{product.name}</TD>
              <TD>{formatCurrency(product.price)}</TD>
              <TD>
                <span
                  className={
                    product.stockQuantity <= 10
                      ? "text-warning font-medium"
                      : ""
                  }
                >
                  {product.stockQuantity}
                </span>
              </TD>
              <TD>
                <Badge variant={product.isActive ? "success" : "default"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </TD>
              <TD>
                <Button variant="ghost" size="sm">
                  <Link
                    href={`/products/${product.id}`}
                    className="font-medium hover:text-accent"
                  >
                    Edit
                  </Link>
                </Button>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editing}
      />
    </>
  );
}
