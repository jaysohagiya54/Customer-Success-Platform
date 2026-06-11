"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileInput } from "@/lib/validation";
import {
  updateProfile,
  logoutUser,
  clearAuthError,
} from "@/store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const error = useAppSelector((s) => s.auth.error);

  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user?.full_name ?? "", password: "" },
  });

  useEffect(() => {
    dispatch(clearAuthError());
    reset({ full_name: user?.full_name ?? "", password: "" });
  }, [user, reset, dispatch]);

  const onSubmit = handleSubmit(async (values) => {
    setSuccess(false);
    try {
      await dispatch(updateProfile(values)).unwrap();
      setSuccess(true);
      reset({ full_name: values.full_name, password: "" });
    } catch {
      // error surfaced via auth.error
    }
  });

  const onLogout = async () => {
    await dispatch(logoutUser());
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-theme">Profile</h1>
          <p className="mt-0.5 text-sm text-muted">Manage your account settings</p>
        </div>
        <Button variant="ghost" onClick={onLogout}>
          Log out
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-theme">{user.full_name}</p>
            <p className="text-xs text-muted">{user.email}</p>
          </div>
          <Badge tone={user.role === "admin" ? "purple" : "blue"} className="ml-auto">
            {user.role === "admin" ? "Admin" : "CSM"}
          </Badge>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              Profile updated successfully.
            </div>
          )}

          <Input label="Email" type="email" value={user.email} readOnly disabled />
          <Input
            label="Full name"
            error={errors.full_name?.message}
            {...register("full_name")}
          />
          <Input
            label="New password (optional)"
            type="password"
            autoComplete="new-password"
            placeholder="Leave blank to keep current"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="flex justify-end pt-1">
            <Button type="submit" loading={isSubmitting}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
