"use client";

import { ReactNode } from "react";
import { Button } from "@/app/components/ui/button";

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  isLoading?: boolean;
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "destructive",
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h3 className="text-lg font-semibold">{title}</h3>

        <div className="mt-2 text-sm text-muted-foreground">{message}</div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
