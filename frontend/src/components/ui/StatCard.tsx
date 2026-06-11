import { ReactNode } from "react";
import Card from "@/components/ui/Card";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: "brand" | "green" | "yellow" | "red";
}

const accents: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "text-accent",
  green: "text-green-600 dark:text-green-400",
  yellow: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
};

export default function StatCard({ label, value, icon, accent = "brand" }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
          <p className={`mt-3 text-3xl font-semibold tracking-tight ${accents[accent]}`}>{value}</p>
        </div>
        {icon && <div className={`text-xl ${accents[accent]} opacity-60`}>{icon}</div>}
      </div>
    </Card>
  );
}
