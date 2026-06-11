"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchCustomer,
  deleteCustomer,
  clearSelected,
} from "@/store/slices/customersSlice";
import { fetchInteractions } from "@/store/slices/interactionsSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import {
  CustomerStatusBadge,
  InteractionTypeBadge,
  SentimentBadge,
} from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CustomerFormModal from "@/components/customers/CustomerFormModal";
import { formatDateTime } from "@/lib/format";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1.5 text-sm text-theme">{value}</dd>
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { selected, loading, error, mutating } = useAppSelector((s) => s.customers);
  const role = useAppSelector((s) => s.auth.user?.role);
  const interactionsPage = useAppSelector((s) => s.interactions.page);

  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomer(id));
    dispatch(fetchInteractions({ customerId: id, type: "", page: 1, pageSize: 50 }));
    return () => {
      dispatch(clearSelected());
    };
  }, [dispatch, id]);

  const onDelete = async () => {
    try {
      await dispatch(deleteCustomer(id)).unwrap();
      router.push("/customers");
    } catch {
      setConfirmOpen(false);
    }
  };

  if (loading && !selected) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !selected) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchCustomer(id))} />;
  }

  if (!selected) return null;

  const interactions = interactionsPage?.items ?? [];

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/customers"
            className="text-sm text-muted hover:text-accent transition-colors"
            style={{ "--hover-color": "var(--accent)" } as React.CSSProperties}
          >
            ← Back to customers
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-theme">{selected.name}</h1>
          <p className="mt-0.5 text-sm text-muted">{selected.company}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          {role === "admin" && (
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Delete
            </Button>
          )}
        </div>
      </div>

      <Card className="p-6">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Company" value={selected.company} />
          <Field label="Email" value={selected.email} />
          <Field label="Phone" value={selected.phone ?? "—"} />
          <Field label="Status" value={<CustomerStatusBadge status={selected.status} />} />
          <Field label="Owner" value={selected.owner_name ?? "—"} />
          <Field label="Interactions" value={selected.interaction_count} />
          <Field label="Created" value={formatDateTime(selected.created_at)} />
          <Field label="Updated" value={formatDateTime(selected.updated_at)} />
        </dl>
      </Card>

      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-soft">Interactions</h2>
          <Link
            href={`/interactions?customerId=${selected.id}`}
            className="text-sm font-medium text-accent hover:opacity-80 transition-opacity"
          >
            Add / view all →
          </Link>
        </div>
        {interactions.length === 0 ? (
          <p className="text-sm text-muted">No interactions for this customer yet.</p>
        ) : (
          <ul className="divide-y divide-theme">
            {interactions.map((it) => (
              <li key={it.id}>
                <Link
                  href={`/interactions/${it.id}`}
                  className="flex items-center justify-between gap-4 py-3.5 px-1 rounded-lg hover:bg-surface-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-theme">{it.title}</p>
                    <p className="text-xs text-muted mt-0.5">{formatDateTime(it.occurred_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <InteractionTypeBadge type={it.type} />
                    {it.insight && <SentimentBadge sentiment={it.insight.sentiment} />}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <CustomerFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        customer={selected}
        onSuccess={() => dispatch(fetchCustomer(id))}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete customer"
        message={`Delete ${selected.name}? This will permanently remove all their data and cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={mutating}
        onConfirm={onDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
