"use client";

import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

type DatePickerProps = {
  value?: string;
  onChange: (date: string) => void;
  onClear?: () => void;
};

export function DatePicker({ value = "", onChange, onClear }: DatePickerProps) {
  const currentDate = value || new Date().toISOString().split("T")[0];

  function goToDate(direction: "prev" | "next") {
    const date = new Date(`${currentDate}T00:00:00`);

    date.setDate(date.getDate() + (direction === "prev" ? -1 : 1));

    onChange(date.toISOString().split("T")[0]);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
  }

  function goToToday() {
    const today = new Date().toISOString().split("T")[0];

    onChange(today);
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background p-1 shadow-sm">
      <button
        type="button"
        onClick={goToToday}
        className="rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Today
      </button>

      <span className="h-4 w-px bg-border" />

      <button
        type="button"
        onClick={() => goToDate("prev")}
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Previous day"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <label className="relative flex items-center">
        <CalendarDays className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />

        <input
          type="date"
          value={value}
          onChange={handleDateChange}
          className="h-7 w-34 rounded-md border-0 bg-transparent pl-7 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <button
        type="button"
        onClick={() => goToDate("next")}
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Next day"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
          aria-label="Clear date filter"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
