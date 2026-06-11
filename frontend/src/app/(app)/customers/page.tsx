"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchCustomers,
  setFilters,
  type CustomerFilters,
} from "@/store/slices/customersSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { CustomerStatusBadge } from "@/components/ui/Badge";
import CustomerFormModal from "@/components/customers/CustomerFormModal";
import type { CustomerStatus } from "@/types";

const STATUS_FILTER_OPTIONS = [
  { value: "prospect", label: "Prospect" },
  { value: "active", label: "Active" },
  { value: "at_risk", label: "At Risk" },
  { value: "churned", label: "Churned" },
];

export default function CustomersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { page, filters, loading, error, lastFetchedAt, lastFetchedKey } = useAppSelector((s) => s.customers);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.search) {
        dispatch(setFilters({ search: searchInput, page: 1 }));
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, filters.search, dispatch]);

  const queryKey = `${filters.search}|${filters.status}|${filters.page}|${filters.pageSize}`;
  useEffect(() => {
    const isStale = !lastFetchedAt || Date.now() - lastFetchedAt > 30_000;
    if (isStale || lastFetchedKey !== queryKey) {
      dispatch(fetchCustomers(filters));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, queryKey]);

  const onStatusChange = (value: string) => {
    dispatch(setFilters({ status: value as CustomerFilters["status"], page: 1 }));
  };

  const goPrev = () => dispatch(setFilters({ page: Math.max(filters.page - 1, 1) }));
  const goNext = () => dispatch(setFilters({ page: filters.page + 1 }));
  const reload = () => dispatch(fetchCustomers(filters));

  const items = page?.items ?? [];
  const statusValue: string = filters.status;

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
          title="No customers found"
          description="Try adjusting your filters or add a new customer."
          action={<Button onClick={() => setModalOpen(true)}>New Customer</Button>}
        />
      );
    }
    return (
      <Card className="overflow-hidden">
        <table className="min-w-full divide-y divide-theme text-sm">
          <thead className="bg-surface-2">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-muted">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Company</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Interactions</th>
              <th className="px-5 py-3">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme">
            {items.map((c) => (
              <tr
                key={c.id}
                onClick={() => router.push(`/customers/${c.id}`)}
                className="cursor-pointer hover:bg-surface-2 transition-colors"
              >
                <td className="px-5 py-3.5 font-medium text-theme">{c.name}</td>
                <td className="px-5 py-3.5 text-soft">{c.company}</td>
                <td className="px-5 py-3.5 text-muted">{c.email}</td>
                <td className="px-5 py-3.5">
                  <CustomerStatusBadge status={c.status} />
                </td>
                <td className="px-5 py-3.5 text-soft">{c.interaction_count}</td>
                <td className="px-5 py-3.5 text-muted">{c.owner_name ?? "—"}</td>
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
          <h1 className="text-2xl font-semibold tracking-tight text-theme">Customers</h1>
          <p className="mt-0.5 text-sm text-muted">Manage your customer accounts</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>New Customer</Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Input
            label="Search"
            placeholder="Name, company, or email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            label="Status"
            placeholder="All statuses"
            options={STATUS_FILTER_OPTIONS}
            value={statusValue}
            onChange={(e) => onStatusChange(e.target.value)}
          />
        </div>
      </div>

      {body}

      {page && page.items.length > 0 && (
        <Pagination page={page.page} pages={page.pages} onPrev={goPrev} onNext={goNext} />
      )}

      <CustomerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={reload}
      />
    </div>
  );
}
