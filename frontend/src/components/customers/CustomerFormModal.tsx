"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, type CustomerInput } from "@/lib/validation";
import {
  createCustomer,
  updateCustomer,
  clearCustomerError,
} from "@/store/slices/customersSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import type { Customer } from "@/types";

const STATUS_OPTIONS = [
  { value: "prospect", label: "Prospect" },
  { value: "active", label: "Active" },
  { value: "at_risk", label: "At Risk" },
  { value: "churned", label: "Churned" },
];

export interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer;
  onSuccess?: () => void;
}

export default function CustomerFormModal({
  open,
  onClose,
  customer,
  onSuccess,
}: CustomerFormModalProps) {
  const dispatch = useAppDispatch();
  const error = useAppSelector((s) => s.customers.error);
  const mutating = useAppSelector((s) => s.customers.mutating);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      status: "prospect",
    },
  });

  useEffect(() => {
    if (open) {
      dispatch(clearCustomerError());
      reset({
        name: customer?.name ?? "",
        company: customer?.company ?? "",
        email: customer?.email ?? "",
        phone: customer?.phone ?? "",
        status: customer?.status ?? "prospect",
      });
    }
  }, [open, customer, reset, dispatch]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (customer) {
        await dispatch(updateCustomer({ id: customer.id, input: values })).unwrap();
      } else {
        await dispatch(createCustomer(values)).unwrap();
      }
      onSuccess?.();
      onClose();
    } catch {
      // error surfaced via customers.error
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={customer ? "Edit customer" : "New customer"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutating}>
            Cancel
          </Button>
          <Button type="submit" form="customer-form" loading={mutating}>
            {customer ? "Save changes" : "Create"}
          </Button>
        </>
      }
    >
      <form id="customer-form" onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
        )}
        <Input label="Name" error={errors.name?.message} {...register("name")} />
        <Input label="Company" error={errors.company?.message} {...register("company")} />
        <Input
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input label="Phone (optional)" error={errors.phone?.message} {...register("phone")} />
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          error={errors.status?.message}
          {...register("status")}
        />
      </form>
    </Modal>
  );
}
