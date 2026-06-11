"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchInteractions,
  setInteractionFilters,
  type InteractionFilters,
} from "@/store/slices/interactionsSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import {
  InteractionTypeBadge,
  SentimentBadge,
  SourceBadge,
} from "@/components/ui/Badge";
import InteractionFormModal from "@/components/interactions/InteractionFormModal";
import { formatDateTime } from "@/lib/format";
import type { Customer, InteractionType, Page } from "@/types";

const TYPE_FILTER_OPTIONS = [
  { value: "meeting", label: "Meeting" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "note", label: "Note" },
];

function InteractionsPageInner() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { page, filters, loading, error } = useAppSelector((s) => s.interactions);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Page<Customer>>("/customers?page=1&page_size=100")
      .then(({ data }) => {
        if (!cancelled) setCustomers(data.items);
      })
      .catch(() => {
        if (!cancelled) setCustomers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const customerId = searchParams.get("customerId");
    if (customerId && customerId !== filters.customerId) {
      dispatch(setInteractionFilters({ customerId, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const queryKey = `${filters.customerId}|${filters.type}|${filters.page}|${filters.pageSize}`;
  useEffect(() => {
    dispatch(fetchInteractions(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, queryKey]);

  const reload = () => dispatch(fetchInteractions(filters));
  const goPrev = () =>
    dispatch(setInteractionFilters({ page: Math.max(filters.page - 1, 1) }));
  const goNext = () => dispatch(setInteractionFilters({ page: filters.page + 1 }));

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.name} — ${c.company}`,
  }));

  const items = page?.items ?? [];

  const body = useMemo(() => {
    if (loading && !page) {
      return (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      );
    }
    if (error && !page) {
      return <ErrorState message={error} onRetry={reload} />;
    }
    if (items.length === 0) {
      return (
        <EmptyState
          title="No interactions found"
          description="Try adjusting your filters or log a new interaction."
          action={<Button onClick={() => setModalOpen(true)}>New Interaction</Button>}
        />
      );
    }
    return (
      <Card className="overflow-hidden">
        <table className="min-w-full divide-y divide-theme text-sm">
          <thead className="bg-surface-2">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-muted">
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Occurred</th>
              <th className="px-5 py-3">Insight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme">
            {items.map((it) => (
              <tr
                key={it.id}
                onClick={() => router.push(`/interactions/${it.id}`)}
                className="cursor-pointer hover:bg-surface-2 transition-colors"
              >
                <td className="px-5 py-3.5 font-medium text-theme">{it.title}</td>
                <td className="px-5 py-3.5 text-soft">{it.customer_name ?? "—"}</td>
                <td className="px-5 py-3.5">
                  <InteractionTypeBadge type={it.type} />
                </td>
                <td className="px-5 py-3.5 text-muted">{formatDateTime(it.occurred_at)}</td>
                <td className="px-5 py-3.5">
                  {it.insight ? (
                    <span className="flex items-center gap-2">
                      <SentimentBadge sentiment={it.insight.sentiment} />
                      <SourceBadge source={it.insight.source} />
                    </span>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error, page, items, router]);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-theme">Interactions</h1>
          <p className="mt-0.5 text-sm text-muted">Log and review customer interactions</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>New Interaction</Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Select
            label="Customer"
            placeholder="All customers"
            options={customerOptions}
            value={filters.customerId}
            onChange={(e) =>
              dispatch(setInteractionFilters({ customerId: e.target.value, page: 1 }))
            }
          />
        </div>
        <div className="w-48">
          <Select
            label="Type"
            placeholder="All types"
            options={TYPE_FILTER_OPTIONS}
            value={filters.type}
            onChange={(e) =>
              dispatch(
                setInteractionFilters({
                  type: e.target.value as InteractionFilters["type"],
                  page: 1,
                }),
              )
            }
          />
        </div>
      </div>

      {body}

      {page && page.items.length > 0 && (
        <Pagination page={page.page} pages={page.pages} onPrev={goPrev} onNext={goNext} />
      )}

      <InteractionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        customers={customers}
        defaultCustomerId={filters.customerId || undefined}
        onSuccess={reload}
      />
    </div>
  );
}

export default function InteractionsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Spinner size="lg" /></div>}>
      <InteractionsPageInner />
    </Suspense>
  );
}
