"use client";

import { ApiError } from "@/lib/api/http/envelope";
import { Button } from "@/app/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message =
    error instanceof ApiError
      ? error.message
      : (error.message ?? "Something went wrong");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h2 className="text-lg font-semibold">Failed to load</h2>
      <p className="text-sm text-muted">{message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
