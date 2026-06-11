"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUsers, updateUserRole } from "@/store/slices/usersSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import Select from "@/components/ui/Select";
import CreateUserModal from "@/components/users/CreateUserModal";
import type { UserRole } from "@/types";

const ROLE_OPTIONS = [
  { value: "csm", label: "CSM" },
  { value: "admin", label: "Admin" },
];

export default function AdminUsersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const currentUser = useAppSelector((s) => s.auth.user);
  const { users, loading, error, mutating } = useAppSelector((s) => s.users);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      dispatch(fetchUsers());
    }
  }, [dispatch, currentUser]);

  if (!currentUser || currentUser.role !== "admin") return null;

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && users.length === 0) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchUsers())} />;
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-theme">User Management</h1>
          <p className="mt-0.5 text-sm text-muted">Manage platform users and their roles. Admin only.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>New User</Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <table className="min-w-full divide-y divide-theme text-sm">
          <thead className="bg-surface-2">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-muted">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3 w-44">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme">
            {users.map((user) => {
              const isSelf = user.id === currentUser.id;
              return (
                <tr key={user.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-theme">
                    {user.full_name}
                    {isSelf && <span className="ml-2 text-xs text-muted">(you)</span>}
                  </td>
                  <td className="px-5 py-3.5 text-muted">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={user.is_active ? "green" : "red"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    {isSelf ? (
                      <Badge tone={user.role === "admin" ? "purple" : "blue"}>
                        {user.role === "admin" ? "Admin" : "CSM"}
                      </Badge>
                    ) : (
                      <Select
                        options={ROLE_OPTIONS}
                        value={user.role}
                        disabled={mutating}
                        onChange={(e) =>
                          dispatch(updateUserRole({ userId: user.id, role: e.target.value as UserRole }))
                        }
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <CreateUserModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
