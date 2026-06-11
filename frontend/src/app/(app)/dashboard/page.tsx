"use client";

import { useEffect } from "react";
import Link from "next/link";
import { fetchMetrics } from "@/store/slices/dashboardSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Badge, {
  InteractionTypeBadge,
  SentimentBadge,
  customerStatusBadge,
} from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";
import type { CustomerStatus, Sentiment } from "@/types";

const STATUS_ORDER: CustomerStatus[] = ["prospect", "active", "at_risk", "churned"];
const SENTIMENTS: { key: Sentiment; label: string; valueClass: string }[] = [
  { key: "positive", label: "Positive", valueClass: "text-green-600 dark:text-green-400" },
  { key: "neutral", label: "Neutral", valueClass: "text-muted" },
  { key: "negative", label: "Negative", valueClass: "text-red-600 dark:text-red-400" },
];

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { metrics, loading, error } = useAppSelector((s) => s.dashboard);

  useEffect(() => {
    dispatch(fetchMetrics());
  }, [dispatch]);

  if (loading && !metrics) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !metrics) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchMetrics())} />;
  }

  if (!metrics) {
    return <EmptyState title="No dashboard data" description="Metrics are not available yet." />;
  }

  const totalByStatus = STATUS_ORDER.reduce(
    (sum, s) => sum + (metrics.customers_by_status[s] ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-theme">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted">Your customer success overview</p>
        </div>
        {metrics.cached && (
          <Badge tone="gray">cached</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Customers" value={metrics.total_customers} accent="brand" />
        <StatCard
          label="Active Customers"
          value={metrics.customers_by_status.active ?? 0}
          accent="green"
        />
        <StatCard
          label="Interactions (30d)"
          value={metrics.interactions_last_30_days}
          accent="brand"
        />
        <StatCard label="AI Insights" value={metrics.insights_generated} accent="brand" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-5 text-sm font-semibold text-soft">Customers by status</h2>
          <div className="flex flex-col gap-4">
            {STATUS_ORDER.map((status) => {
              const count = metrics.customers_by_status[status] ?? 0;
              const pct = totalByStatus > 0 ? Math.round((count / totalByStatus) * 100) : 0;
              const { label } = customerStatusBadge(status);
              return (
                <div key={status} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-soft">{label}</span>
                    <span className="font-medium text-theme">{count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-2">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: "var(--accent)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-5 text-sm font-semibold text-soft">Sentiment breakdown</h2>
          <div className="grid grid-cols-3 gap-3">
            {SENTIMENTS.map(({ key, label, valueClass }) => (
              <div
                key={key}
                className="flex flex-col items-center rounded-xl border border-theme py-5 bg-surface-2"
              >
                <span className={`text-2xl font-semibold tracking-tight ${valueClass}`}>
                  {metrics.sentiment_breakdown[key] ?? 0}
                </span>
                <span className="mt-1.5 text-xs text-muted">{label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-5 text-sm font-semibold text-soft">Recent interactions</h2>
        {metrics.recent_interactions.length === 0 ? (
          <p className="text-sm text-muted">No recent interactions yet.</p>
        ) : (
          <ul className="divide-y divide-theme">
            {metrics.recent_interactions.map((ri) => (
              <li key={ri.id}>
                <Link
                  href={`/interactions/${ri.id}`}
                  className="flex items-center justify-between gap-4 py-3.5 px-1 rounded-lg hover:bg-surface-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-theme">{ri.title}</p>
                    <p className="truncate text-xs text-muted mt-0.5">{ri.customer_name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <InteractionTypeBadge type={ri.type} />
                    {ri.sentiment && <SentimentBadge sentiment={ri.sentiment} />}
                    <span className="hidden text-xs text-muted sm:inline">
                      {formatDateTime(ri.occurred_at)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
