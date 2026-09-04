"use client";

import { cn } from "@/lib/utils/cn";
import { Button } from "./button";
import { useEffect } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-[95vw]",
};

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode | string;
  children: React.ReactNode;
  className?: string;
  size?: ModalSize;
  /** Set true when `title` already renders its own close affordance */
  hideDefaultClose?: boolean;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  size = "lg",
  hideDefaultClose = false,
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div
        className={cn(
          "relative z-10 grid max-h-[90vh] w-full grid-rows-[auto,1fr] rounded-2xl border border-border/60 bg-card shadow-2xl ring-1 ring-black/5",
          "animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200",
          sizeClasses[size],
          className,
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border/60 px-6 py-4">
          <div className="min-w-0 flex-1 text-lg font-semibold text-foreground">
            {title}
          </div>
          {!hideDefaultClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              type="button"
              className="h-8 w-8 shrink-0 rounded-full p-0 hover:bg-muted"
              aria-label="Close"
            >
              ✕
            </Button>
          )}
        </div>

        <div className="overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-muted-foreground/20">
          {children}
        </div>
      </div>
    </div>
  );
}
