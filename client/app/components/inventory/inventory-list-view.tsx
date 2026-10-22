"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, PackageOpen, Plus, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/toast";
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
import { DatePicker } from "../ui/date-picker";

type MovementType =
  | "INITIAL_STOCK"
  | "RESTOCK"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT";

type FormMovementType = "RESTOCK" | "ADJUSTMENT" | "INITIAL_STOCK";

type AdjustmentReason =
  | "DAMAGED"
  | "EXPIRED"
  | "LOST"
  | "FOUND"
  | "CORRECTION"
  | "OTHER";

type Direction = "increase" | "decrease";

const selectClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

const typeOptions: {
  value: FormMovementType;
  label: string;
  hint: string;
}[] = [
  { value: "RESTOCK", label: "Restock", hint: "Received new stock" },
  { value: "ADJUSTMENT", label: "Adjust", hint: "Fix damage, loss or counts" },
  { value: "INITIAL_STOCK", label: "Initial", hint: "Set opening stock" },
];

const reasonOptions: { value: AdjustmentReason; label: string }[] = [
  { value: "CORRECTION", label: "Stock count correction" },
  { value: "DAMAGED", label: "Damaged goods" },
  { value: "EXPIRED", label: "Expired goods" },
  { value: "LOST", label: "Missing stock" },
  { value: "FOUND", label: "Found stock" },
  { value: "OTHER", label: "Other" },
];

function CreateMovementModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createMovement = useCreateMovement();
  const { data: products = [], isLoading: productsLoading } = useProducts();

  const [productId, setProductId] = useState("");
  const [type, setType] = useState<FormMovementType>("RESTOCK");
  const [quantity, setQuantity] = useState("");
  const [direction, setDirection] = useState<Direction>("increase");
  const [reason, setReason] = useState<AdjustmentReason>("CORRECTION");
  const [note, setNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isPending = createMovement.isPending;

  useEffect(() => {
    if (open) {
      setProductId("");
      setType("RESTOCK");
      setQuantity("");
      setDirection("increase");
      setReason("CORRECTION");
      setNote("");
      setFieldErrors({});
      createMovement.reset();
    }
  }, [open]);

  function handleClose() {
    if (!isPending) onClose();
  }

  function clearError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key] && !prev._form) return prev;
      const next = { ...prev };
      delete next[key];
      delete next._form;
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;

    setFieldErrors({});

    const parsedAmount = quantity === "" ? 0 : Number(quantity);
    const signedQuantity =
      type === "ADJUSTMENT" && direction === "decrease"
        ? -parsedAmount
        : parsedAmount;

    const payload = {
      productId,
      type,
      quantity: signedQuantity,
      ...(type === "ADJUSTMENT" ? { reason } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    };

    const result = createMovementSchema.safeParse(payload);

    if (!result.success) {
      const errors: Record<string, string> = {};

      for (const issue of result.error.issues) {
        const key = issue.path[0];
        const target = typeof key === "string" ? key : "_form";

        if (!errors[target]) {
          errors[target] = issue.message;
        }
      }

      setFieldErrors(errors);
      return;
    }

    const test = createMovement.mutate(result.data, {
      onSuccess: onClose,
    });
    console.log("🚀 ~ handleSubmit ~ test:", test);
  }

  const amount = quantity === "" ? 0 : Number(quantity);
  const selectedProduct = products.find((product) => product.id === productId);
  const isRemoving = type === "ADJUSTMENT" && direction === "decrease";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="lg"
      dismissible={!isPending}
      title="Record movement"
      description="Log a change to a product's stock level."
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>

          <Button type="submit" form="movement-form" disabled={isPending}>
            {isPending ? "Saving..." : "Save movement"}
          </Button>
        </>
      }
    >
      <form
        id="movement-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6"
      >
        <div>
          <label
            htmlFor="movement-product"
            className="mb-2 block text-sm font-medium"
          >
            Product
          </label>

          <select
            id="movement-product"
            data-autofocus
            className={selectClass}
            value={productId}
            disabled={isPending || productsLoading}
            onChange={(e) => {
              setProductId(e.target.value);
              clearError("productId");
            }}
          >
            <option value="">
              {productsLoading ? "Loading products..." : "Select product"}
            </option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>

          {fieldErrors.productId && (
            <p className="mt-1.5 text-xs text-danger">
              {fieldErrors.productId}
            </p>
          )}
        </div>

        <fieldset disabled={isPending}>
          <legend className="mb-2 text-sm font-medium">Movement type</legend>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {typeOptions.map((option) => {
              const active = type === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setType(option.value);
                    clearError("type");
                    clearError("reason");
                  }}
                  className={`min-w-0 rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-60 ${
                    active
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                  }`}
                >
                  <span className="block truncate text-sm font-medium">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                    {option.hint}
                  </span>
                </button>
              );
            })}
          </div>

          {fieldErrors.type && (
            <p className="mt-1.5 text-xs text-danger">{fieldErrors.type}</p>
          )}
        </fieldset>

        {type === "ADJUSTMENT" && (
          <div className="space-y-5 rounded-xl border border-border/70 bg-muted/30 p-4">
            <div>
              <span className="mb-2 block text-sm font-medium">Direction</span>

              <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1">
                {(["increase", "decrease"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={isPending}
                    aria-pressed={direction === option}
                    onClick={() => setDirection(option)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      direction === option
                        ? option === "decrease"
                          ? "bg-danger/10 text-danger"
                          : "bg-success/10 text-success"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option === "increase" ? "Add stock" : "Remove stock"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="movement-reason"
                className="mb-2 block text-sm font-medium"
              >
                Reason
              </label>

              <select
                id="movement-reason"
                className={selectClass}
                value={reason}
                disabled={isPending}
                onChange={(e) => {
                  setReason(e.target.value as AdjustmentReason);
                  clearError("reason");
                }}
              >
                {reasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {fieldErrors.reason && (
                <p className="mt-1.5 text-xs text-danger">
                  {fieldErrors.reason}
                </p>
              )}
            </div>
          </div>
        )}

        <div>
          <Input
            label="Quantity"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={quantity}
            disabled={isPending}
            onChange={(e) => {
              setQuantity(e.target.value.replace(/\D/g, ""));
              clearError("quantity");
            }}
            error={fieldErrors.quantity}
          />

          {amount > 0 && (
            <p
              className={`mt-1.5 break-words text-xs ${
                isRemoving ? "text-danger" : "text-success"
              }`}
            >
              {isRemoving ? "Removes" : "Adds"}{" "}
              <span className="font-medium tabular-nums">{amount}</span>{" "}
              {isRemoving ? "from" : "to"}{" "}
              {selectedProduct ? selectedProduct.name : "the selected product"}
            </p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label htmlFor="movement-note" className="text-sm font-medium">
              Note{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>

            <span className="text-xs tabular-nums text-muted-foreground">
              {note.length}/1000
            </span>
          </div>

          <textarea
            id="movement-note"
            className="max-h-40 min-h-20 w-full resize-y break-words rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            value={note}
            disabled={isPending}
            onChange={(e) => {
              setNote(e.target.value);
              clearError("note");
            }}
            placeholder="Explain the stock movement..."
            rows={3}
            maxLength={1000}
          />

          {fieldErrors.note && (
            <p className="mt-1.5 text-xs text-danger">{fieldErrors.note}</p>
          )}
        </div>

        {(fieldErrors._form || createMovement.isError) && (
          <div
            role="alert"
            className="break-words rounded-xl border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger"
          >
            {fieldErrors._form ??
              createMovement.error?.message ??
              "Something went wrong. Please try again."}
          </div>
        )}
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

function getMovementLabel(type: MovementType) {
  const labels: Record<MovementType, string> = {
    INITIAL_STOCK: "Initial stock",
    RESTOCK: "Restock",
    SALE: "Sale",
    RETURN: "Return",
    ADJUSTMENT: "Adjustment",
  };

  return labels[type];
}

export function InventoryListView({ data }: { data: MovementsListResponse }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedDate = searchParams.get("startDate") ?? "";
  const selectedType = searchParams.get("type") ?? "";
  const appliedSearch = searchParams.get("search") ?? "";

  const parsedPage = Number(searchParams.get("page") ?? "1");
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  useEffect(() => {
    setSearchInput(appliedSearch);
  }, [appliedSearch]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const search = searchInput.trim();

      if (search !== appliedSearch) {
        updateSearchParams({
          search: search || null,
          page: null,
        });
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput, appliedSearch]);

  function updateSearchParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const query = params.toString();

    router.push(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function handleDateChange(date: string) {
    updateSearchParams({
      startDate: date || null,
      endDate: date || null,
      page: null,
    });
  }

  function handleTypeChange(type: string) {
    updateSearchParams({
      type: type || null,
      page: null,
    });
  }

  function handlePageChange(nextPage: number) {
    updateSearchParams({
      page: nextPage > 1 ? String(nextPage) : null,
    });
  }

  function clearSearch() {
    setSearchInput("");
    updateSearchParams({ search: null, page: null });
  }

  function clearFilters() {
    setSearchInput("");

    updateSearchParams({
      startDate: null,
      endDate: null,
      type: null,
      search: null,
      page: null,
    });
  }

  const movements = data.movements;
  const pagination = data.pagination;

  const hasFilters = Boolean(selectedDate || selectedType || appliedSearch);
  const totalPages = Math.max(1, pagination.totalPages);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Stock movements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track every restock, sale, return and adjustment.
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Record movement
        </Button>
      </div>

      <div className="mb-5 rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products or aliases..."
              aria-label="Search products or aliases"
              className="h-10 w-full rounded-xl border border-border/70 bg-background pl-9 pr-9 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
            />

            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </div>

            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              onClear={() => handleDateChange("")}
            />

            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              aria-label="Filter by movement type"
              className="h-9 min-w-40 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="">All movement types</option>
              <option value="INITIAL_STOCK">Initial stock</option>
              <option value="RESTOCK">Restock</option>
              <option value="SALE">Sale</option>
              <option value="RETURN">Return</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>

            {hasFilters && (
              <Button type="button" variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            <span className="text-xs text-muted-foreground">
              Active filters:
            </span>

            {selectedDate && (
              <Badge variant="default">Date: {selectedDate}</Badge>
            )}

            {selectedType && (
              <Badge variant="default">
                Type: {getMovementLabel(selectedType as MovementType)}
              </Badge>
            )}

            {appliedSearch && (
              <Badge variant="default">Search: {appliedSearch}</Badge>
            )}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-col gap-1 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h2 className="font-medium">Movement history</h2>

          <p className="text-xs text-muted-foreground">
            Showing {movements.length} of {pagination.total} movements
          </p>
        </div>

        <div className="overflow-x-auto">
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
              {movements.map((movement) => (
                <TR key={movement.id}>
                  <TD>
                    <span className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(movement.createdAt)}
                    </span>
                  </TD>

                  <TD>
                    <span className="font-medium">
                      {movement.product?.name ?? movement.productId}
                    </span>
                  </TD>

                  <TD>
                    <Badge variant={typeVariant[movement.type]}>
                      {getMovementLabel(movement.type)}
                    </Badge>
                  </TD>

                  <TD>
                    <span
                      className={`font-medium tabular-nums ${
                        movement.type === "SALE" || movement.quantity < 0
                          ? "text-danger"
                          : "text-success"
                      }`}
                    >
                      {movement.type === "SALE"
                        ? `-${Math.abs(movement.quantity)}`
                        : movement.quantity > 0
                          ? `+${movement.quantity}`
                          : movement.quantity}
                    </span>
                  </TD>
                </TR>
              ))}

              {movements.length === 0 && (
                <TR>
                  <TD colSpan={4} className="py-0">
                    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                        <PackageOpen className="h-6 w-6 text-muted-foreground" />
                      </div>

                      <p className="font-medium">No movements found</p>

                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {hasFilters
                          ? "Try changing your search or clearing some filters."
                          : "Stock movements will appear here when they are recorded."}
                      </p>

                      {hasFilters ? (
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={clearFilters}
                        >
                          Clear filters
                        </Button>
                      ) : (
                        <Button
                          className="mt-4"
                          onClick={() => setModalOpen(true)}
                        >
                          Record movement
                        </Button>
                      )}
                    </div>
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-muted-foreground">
            Page{" "}
            <span className="font-medium text-foreground">
              {pagination.page}
            </span>{" "}
            of <span className="font-medium text-foreground">{totalPages}</span>
            <span className="mx-2">·</span>
            {pagination.total} total movements
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>

            <Button
              variant="outline"
              disabled={
                pagination.totalPages === 0 || page >= pagination.totalPages
              }
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <CreateMovementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
