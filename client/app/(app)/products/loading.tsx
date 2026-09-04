import { Card } from "@/app/components/ui/card";

export default function ProductsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-border/40" />
      <Card>
        <div className="h-64 animate-pulse rounded-xl bg-border/40" />
      </Card>
    </div>
  );
}
