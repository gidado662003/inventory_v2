import { cn } from "@/lib/utils/cn";
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  variant?: "default" | "numeric" | "decimal";
};
export function Input({
  className,
  label,
  error,
  id,
  variant = "default",
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const variantProps = {
    default: { type: props.type ?? "text" },
    numeric: { type: "text" as const, inputMode: "numeric" as const },
    decimal: { type: "text" as const, inputMode: "decimal" as const },
  };
  return (
    <div className="space-y-1.5">
      {" "}
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground"
        >
          {" "}
          {label}{" "}
        </label>
      )}{" "}
      <input
        id={inputId}
        {...variantProps[variant]}
        className={cn(
          "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:ring-2 focus:ring-ring",
          error && "border-danger",
          className,
        )}
        {...props}
      />{" "}
      {error && <p className="text-xs text-danger">{error}</p>}{" "}
    </div>
  );
}
