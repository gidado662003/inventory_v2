import { cn } from "@/lib/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "rounded-2xl bg-card text-card-foreground transition-all duration-200",
  {
    variants: {
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      variant: {
        default: "border border-border/50 shadow-sm",
        elevated: "border border-border/50 shadow-lg shadow-primary/5",
        outline: "border-2 border-border bg-transparent shadow-none",
        ghost: "border-none shadow-none bg-transparent",
        primary:
          "border border-primary/20 bg-primary/5 shadow-sm shadow-primary/5",
      },
      hover: {
        none: "",
        default: "hover:shadow-md hover:border-border/80",
        lift: "hover:-translate-y-1 hover:shadow-xl hover:border-border/80",
        glow: "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30",
      },
      radius: {
        default: "rounded-2xl",
        sm: "rounded-lg",
        md: "rounded-xl",
        lg: "rounded-3xl",
        none: "rounded-none",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      padding: "md",
      variant: "default",
      hover: "default",
      radius: "default",
    },
  },
);

export interface CardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

export function Card({
  className,
  padding,
  variant,
  hover,
  radius,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        cardVariants({ padding, variant, hover, radius }),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Optional: Sub-components for better composition
export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center pt-2", className)} {...props}>
      {children}
    </div>
  );
}

// Compound component export
export const CardCompound = Object.assign(Card, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
});
