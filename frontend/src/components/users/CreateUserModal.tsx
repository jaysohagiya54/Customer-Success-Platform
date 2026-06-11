"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createUser, clearUsersError } from "@/store/slices/usersSlice";
import type { CreateUserInput } from "@/store/slices/usersSlice";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";

const ROLE_OPTIONS = [
  { value: "csm", label: "CSM" },
  { value: "admin", label: "Admin" },
];

const createUserSchema = z.object({
  full_name: z.string().min(2, "Min 2 characters"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Min 8 characters")
    .regex(/[a-zA-Z]/, "Must contain a letter")
    .regex(/[0-9]/, "Must contain a digit"),
  role: z.enum(["admin", "csm"]),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateUserModal({ open, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { error, mutating } = useAppSelector((s) => s.users);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { full_name: "", email: "", password: "", role: "csm" },
  });

  const handleClose = () => {
    dispatch(clearUsersError());
    reset({ full_name: "", email: "", password: "", role: "csm" });
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    const result = await dispatch(createUser(values as CreateUserInput));
    if (createUser.fulfilled.match(result)) {
      handleClose();
    }
  });

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New User"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="create-user-form" loading={isSubmitting || mutating}>
            Create
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        <Input
          label="Full name"
          autoComplete="off"
          error={errors.full_name?.message}
          {...register("full_name")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="off"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Select
          label="Role"
          options={ROLE_OPTIONS}
          error={errors.role?.message}
          {...register("role")}
        />
      </form>
    </Modal>
  );
}
