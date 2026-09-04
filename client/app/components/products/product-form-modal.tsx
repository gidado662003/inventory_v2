"use client";

import { useState, useEffect } from "react";

import { useCreateProduct, useUpdateProduct } from "@/lib/api/product/queries";

import {
  createProductSchema,
  updateProductSchema,
  type Product,
} from "@/lib/api/product/schema";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Modal } from "@/app/components/ui/modal";

import {
  AlertCircle,
  CheckCircle,
  Package,
  Hash,
  Tag,
  RefreshCw,
  Plus,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";

// Reusable form field
function FormField({
  label,
  error,
  children,
  icon: Icon,
  required,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  icon?: React.ElementType;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}

        {label}

        {required && <span className="text-destructive">*</span>}
      </label>

      {children}

      {error && (
        <p className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

// Aliases input
function AliasesInput({
  value,
  onChange,
  error,
}: {
  value: string[];
  onChange: (aliases: string[]) => void;
  error?: string;
}) {
  const [newAlias, setNewAlias] = useState("");

  const handleAddAlias = () => {
    const trimmed = newAlias.trim();

    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setNewAlias("");
    }
  };

  const handleRemoveAlias = (aliasToRemove: string) => {
    onChange(value.filter((alias) => alias !== aliasToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddAlias();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={newAlias}
          onChange={(e) => setNewAlias(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add alias (e.g., Fanta)"
          className={cn(
            "flex-1 transition-all duration-200",
            error && "border-destructive focus-visible:ring-destructive",
          )}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddAlias}
          disabled={!newAlias.trim()}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((alias) => (
            <span
              key={alias}
              className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
            >
              {alias}

              <button
                type="button"
                onClick={() => handleRemoveAlias(alias)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                aria-label={`Remove ${alias}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

type ProductFormModalProps = {
  open: boolean;
  onClose: () => void;
  product?: Product;
  onSuccess?: () => void;
};

export function ProductFormModal({
  open,
  onClose,
  product,
  onSuccess,
}: ProductFormModalProps) {
  const isEdit = !!product;

  const createProduct = useCreateProduct();

  const updateProduct = useUpdateProduct(product?.id ?? "");

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [aliases, setAliases] = useState<string[]>([]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate/reset form
  useEffect(() => {
    if (product) {
      setName(product.name ?? "");
      setPrice(product.price?.toString() ?? "");
      setStockQuantity(product.stockQuantity?.toString() ?? "0");

      // API returns:
      // [{ id, name, productId }]
      //
      // Form needs:
      // ["Fanta", "Sprite"]
      setAliases(product.aliases?.map((alias) => alias.name) ?? []);
    } else {
      setName("");
      setPrice("");
      setStockQuantity("0");
      setAliases([]);
    }

    setFieldErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [product, open]);

  // Clear field errors when corrected
  useEffect(() => {
    if (fieldErrors.name && name.trim()) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }

    if (fieldErrors.price && price) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.price;
        return next;
      });
    }

    if (fieldErrors.stockQuantity && stockQuantity) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.stockQuantity;
        return next;
      });
    }

    if (fieldErrors.aliases && aliases.length > 0) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.aliases;
        return next;
      });
    }
  }, [name, price, stockQuantity, aliases, fieldErrors]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const setValidationErrors = (
    issues: {
      path: PropertyKey[];
      message: string;
    }[],
  ) => {
    const errors: Record<string, string> = {};

    for (const issue of issues) {
      const key = issue.path[0];

      if (typeof key === "string") {
        errors[key] = issue.message;
      }
    }

    setFieldErrors(errors);
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setIsSubmitting(true);

    const allFields = isEdit
      ? ["name", "price", "aliases"]
      : ["name", "price", "stockQuantity", "aliases"];

    const touchedState: Record<string, boolean> = {};

    allFields.forEach((field) => {
      touchedState[field] = true;
    });

    setTouched(touchedState);

    // =========================
    // EDIT
    // =========================
    if (isEdit) {
      const result = updateProductSchema.safeParse({
        name: name.trim(),
        price: price ? Number(price) : undefined,
        aliases: aliases.length > 0 ? aliases : undefined,
        isActive: true,
      });

      if (!result.success) {
        setValidationErrors(result.error.issues);
        setIsSubmitting(false);
        return;
      }

      // IMPORTANT:
      // Only updateProduct is used here.
      updateProduct.mutate(result.data, {
        onSuccess: () => {
          setIsSubmitting(false);
          onSuccess?.();
          onClose();
        },

        onError: () => {
          setIsSubmitting(false);
        },
      });

      return;
    }

    // =========================
    // CREATE
    // =========================
    const result = createProductSchema.safeParse({
      name: name.trim(),
      price: Number(price),
      stockQuantity: Number(stockQuantity),
      aliases: aliases.length > 0 ? aliases : undefined,
      isActive: true,
    });

    if (!result.success) {
      setValidationErrors(result.error.issues);
      setIsSubmitting(false);
      return;
    }

    // IMPORTANT:
    // Only createProduct is used here.
    createProduct.mutate(result.data, {
      onSuccess: () => {
        setIsSubmitting(false);
        onSuccess?.();
        onClose();
      },

      onError: () => {
        setIsSubmitting(false);
      },
    });
  }

  const handlePriceChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPrice(value);
    }
  };

  const handleStockChange = (value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setStockQuantity(value);
    }
  };

  const isFormValid = () => {
    if (isEdit) {
      return name.trim().length > 0 && price !== "" && Number(price) >= 0;
    }

    return (
      name.trim().length > 0 &&
      price !== "" &&
      Number(price) >= 0 &&
      Number(stockQuantity) >= 0
    );
  };

  // Mutation state
  const isPending = isEdit ? updateProduct.isPending : createProduct.isPending;

  const isError = isEdit ? updateProduct.isError : createProduct.isError;

  const error = isEdit ? updateProduct.error : createProduct.error;

  const isSuccess = isEdit ? updateProduct.isSuccess : createProduct.isSuccess;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />

          <span>{isEdit ? "Edit Product" : "New Product"}</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Product Name */}
        <FormField
          label="Product Name"
          error={touched.name ? fieldErrors.name : undefined}
          icon={Tag}
          required
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => handleBlur("name")}
            placeholder="Enter product name"
            className={cn(
              "transition-all duration-200",
              touched.name &&
                fieldErrors.name &&
                "border-destructive focus-visible:ring-destructive",
            )}
            autoFocus={!isEdit}
          />
        </FormField>

        {/* Price & Stock */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Price"
            error={touched.price ? fieldErrors.price : undefined}
            required
          >
            <Input
              type="text"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              onBlur={() => handleBlur("price")}
              placeholder="0.00"
              className={cn(
                "transition-all duration-200",
                touched.price &&
                  fieldErrors.price &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
          </FormField>

          {!isEdit && (
            <FormField
              label="Initial Stock"
              error={
                touched.stockQuantity ? fieldErrors.stockQuantity : undefined
              }
              icon={Hash}
              required
            >
              <Input
                type="text"
                value={stockQuantity}
                onChange={(e) => handleStockChange(e.target.value)}
                onBlur={() => handleBlur("stockQuantity")}
                placeholder="0"
                className={cn(
                  "transition-all duration-200",
                  touched.stockQuantity &&
                    fieldErrors.stockQuantity &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
            </FormField>
          )}
        </div>

        {/* Aliases */}
        <FormField
          label="Aliases"
          error={touched.aliases ? fieldErrors.aliases : undefined}
          icon={Hash}
        >
          <AliasesInput
            value={aliases}
            onChange={setAliases}
            error={touched.aliases ? fieldErrors.aliases : undefined}
          />
        </FormField>

        {/* Edit indicator */}
        {isEdit && product && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4" />

            <span>Updating product ID: {product.id}</span>
          </div>
        )}

        {/* Mutation error */}
        {isError && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <p>{error?.message || "Something went wrong. Please try again."}</p>
          </div>
        )}

        {/* Success */}
        {isSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
            <CheckCircle className="h-4 w-4" />

            <span>Product {isEdit ? "updated" : "created"} successfully!</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting || isPending}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || isPending || !isFormValid()}
            className="min-w-[100px]"
          >
            {isSubmitting || isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

                {isEdit ? "Updating..." : "Creating..."}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />

                {isEdit ? "Update Product" : "Create Product"}
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
