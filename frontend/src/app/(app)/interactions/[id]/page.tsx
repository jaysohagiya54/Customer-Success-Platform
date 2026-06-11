"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  fetchInteraction,
  generateInsight,
  clearSelectedInteraction,
} from "@/store/slices/interactionsSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import {
  InteractionTypeBadge,
  SentimentBadge,
  SourceBadge,
} from "@/components/ui/Badge";
import InteractionFormModal from "@/components/interactions/InteractionFormModal";
import { formatDateTime } from "@/lib/format";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1.5 text-sm text-theme">{value}</dd>
    </div>
  );
}

export default function InteractionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const dispatch = useAppDispatch();

  const { selected, loading, error, generatingInsight } = useAppSelector(
    (s) => s.interactions,
  );

  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchInteraction(id));
    return () => {
      dispatch(clearSelectedInteraction());
    };
  }, [dispatch, id]);

  if (loading && !selected) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !selected) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchInteraction(id))} />;
  }

  if (!selected) return null;

  const insight = selected.insight;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/interactions" className="text-sm text-muted hover:text-accent transition-colors">
            ← Back to interactions
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-theme">{selected.title}</h1>
          {selected.customer_name && (
            <p className="mt-0.5 text-sm text-muted">{selected.customer_name}</p>
          )}
        </div>
        <Button variant="secondary" onClick={() => setEditOpen(true)}>
          Edit
        </Button>
      </div>

      <Card className="p-6">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Type" value={<InteractionTypeBadge type={selected.type} />} />
          <Field
            label="Customer"
            value={
              <Link
                href={`/customers/${selected.customer_id}`}
                className="text-accent hover:opacity-80 transition-opacity"
              >
                {selected.customer_name ?? "View customer"}
              </Link>
            }
          />
          <Field label="Occurred at" value={formatDateTime(selected.occurred_at)} />
          <Field label="Author" value={selected.author_name ?? "—"} />
          <Field label="Created" value={formatDateTime(selected.created_at)} />
          <Field label="Updated" value={formatDateTime(selected.updated_at)} />
        </dl>
        <div className="mt-6 border-t border-theme pt-5">
          <dt className="text-xs font-medium uppercase tracking-wider text-muted">Notes</dt>
          <dd className="mt-2 whitespace-pre-wrap text-sm text-soft leading-relaxed font-serif">
            {selected.notes}
          </dd>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-soft">AI Insights</h2>
            <p className="text-xs text-muted mt-0.5">Auto-generated on creation</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={generatingInsight}
            onClick={() => dispatch(generateInsight(id))}
          >
            Regenerate
          </Button>
        </div>

        {!insight ? (
          <p className="text-sm text-muted">Insight not available — click Regenerate to analyze these notes.</p>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <SentimentBadge sentiment={insight.sentiment} />
              <SourceBadge source={insight.source} />
              {insight.model && (
                <span className="text-xs text-muted">{insight.model}</span>
              )}
              <span className="text-xs text-muted">{formatDateTime(insight.generated_at)}</span>
            </div>

            {insight.source === "fallback" && insight.error_message && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-400">
                Generated by heuristic fallback: {insight.error_message}
              </div>
            )}

            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">Summary</h3>
              <p className="mt-2 text-sm text-theme leading-relaxed">{insight.summary}</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted mb-2">
                  Action items
                </h3>
                {insight.action_items.length === 0 ? (
                  <p className="text-sm text-muted">None</p>
                ) : (
                  <ul className="space-y-1.5 pl-4 text-sm text-soft">
                    {insight.action_items.map((a, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                        {a}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted mb-2">
                  Risks
                </h3>
                {insight.risks.length === 0 ? (
                  <p className="text-sm text-muted">None</p>
                ) : (
                  <ul className="space-y-1.5 pl-4 text-sm text-soft">
                    {insight.risks.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      <InteractionFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        interaction={selected}
        customers={selected.customer_name ? [
          {
            id: selected.customer_id,
            name: selected.customer_name,
            company: "",
            email: "",
            phone: null,
            status: "active",
            owner_id: "",
            owner_name: null,
            interaction_count: 0,
            created_at: selected.created_at,
            updated_at: selected.updated_at,
          },
        ] : []}
        onSuccess={() => dispatch(fetchInteraction(id))}
      />
    </div>
  );
}
