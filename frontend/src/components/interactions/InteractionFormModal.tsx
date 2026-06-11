"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { interactionSchema, type InteractionInput } from "@/lib/validation";
import {
  createInteraction,
  updateInteraction,
  clearInteractionError,
} from "@/store/slices/interactionsSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { isoToDateTimeLocal, dateTimeLocalToIso } from "@/lib/format";
import type { Customer, Interaction } from "@/types";

const TYPE_OPTIONS = [
  { value: "meeting", label: "Meeting" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "note", label: "Note" },
];

export interface InteractionFormModalProps {
  open: boolean;
  onClose: () => void;
  interaction?: Interaction;
  defaultCustomerId?: string;
  customers: Customer[];
  onSuccess?: () => void;
}

export default function InteractionFormModal({
  open,
  onClose,
  interaction,
  defaultCustomerId,
  customers,
  onSuccess,
}: InteractionFormModalProps) {
  const dispatch = useAppDispatch();
  const error = useAppSelector((s) => s.interactions.error);
  const mutating = useAppSelector((s) => s.interactions.mutating);
  const isEdit = Boolean(interaction);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InteractionInput>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      customer_id: defaultCustomerId ?? "",
      type: "meeting",
      title: "",
      notes: "",
      occurred_at: "",
    },
  });

  useEffect(() => {
    if (open) {
      dispatch(clearInteractionError());
      reset({
        customer_id: interaction?.customer_id ?? defaultCustomerId ?? "",
        type: interaction?.type ?? "meeting",
        title: interaction?.title ?? "",
        notes: interaction?.notes ?? "",
        occurred_at: interaction
          ? isoToDateTimeLocal(interaction.occurred_at)
          : isoToDateTimeLocal(new Date().toISOString()),
      });
    }
  }, [open, interaction, defaultCustomerId, reset, dispatch]);

  const onSubmit = handleSubmit(async (values) => {
    const occurredIso = dateTimeLocalToIso(values.occurred_at);
    try {
      if (interaction) {
        // customer_id is fixed on edit; only editable fields are sent.
        await dispatch(
          updateInteraction({
            id: interaction.id,
            input: {
              type: values.type,
              title: values.title,
              notes: values.notes,
              occurred_at: occurredIso,
            },
          }),
        ).unwrap();
      } else {
        await dispatch(
          createInteraction({ ...values, occurred_at: occurredIso }),
        ).unwrap();
      }
      onSuccess?.();
      onClose();
    } catch {
      // error surfaced via interactions.error
    }
  });

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.name} — ${c.company}`,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit interaction" : "New interaction"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutating}>
            Cancel
          </Button>
          <Button type="submit" form="interaction-form" loading={mutating}>
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </>
      }
    >
      <form id="interaction-form" onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
        )}
        <Select
          label="Customer"
          options={customerOptions}
          placeholder="Select a customer"
          error={errors.customer_id?.message}
          disabled={isEdit}
          {...register("customer_id")}
        />
        <Select label="Type" options={TYPE_OPTIONS} error={errors.type?.message} {...register("type")} />
        <Input label="Title" error={errors.title?.message} {...register("title")} />
        <Input
          label="Occurred at"
          type="datetime-local"
          error={errors.occurred_at?.message}
          {...register("occurred_at")}
        />
        <Textarea
          label="Notes"
          rows={5}
          error={errors.notes?.message}
          {...register("notes")}
        />
      </form>
    </Modal>
  );
}
