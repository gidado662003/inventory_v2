import { Card } from "@/app/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="h-12 w-48 animate-pulse rounded-xl bg-border/40" />
      <div className="grid gap-4 md:grid-cols-4 md:grid-rows-2">
        <Card className="md:col-span-2 md:row-span-2">
          <div className="h-32 animate-pulse rounded-xl bg-border/40" />
        </Card>
        <Card>
          <div className="h-20 animate-pulse rounded-xl bg-border/40" />
        </Card>
        <Card>
          <div className="h-20 animate-pulse rounded-xl bg-border/40" />
        </Card>
        <Card className="md:col-span-2">
          <div className="h-40 animate-pulse rounded-xl bg-border/40" />
        </Card>
      </div>
    </div>
  );
}
