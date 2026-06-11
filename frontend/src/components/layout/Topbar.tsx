"use client";

import { useAppSelector } from "@/store/hooks";
import Badge from "@/components/ui/Badge";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Topbar() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <header className="flex h-14 items-center justify-between border-b border-theme bg-sidebar px-5">
      <div className="md:hidden flex items-center gap-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-md text-white text-xs font-bold"
          style={{ backgroundColor: "var(--accent)" }}
        >
          CS
        </div>
        <span className="text-sm font-semibold text-theme">CS Platform</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        {user && (
          <>
            <div className="hidden sm:block h-4 w-px" style={{ backgroundColor: "var(--border)" }} />
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-theme leading-tight">{user.full_name}</p>
              <p className="text-xs text-muted leading-tight">{user.email}</p>
            </div>
            <Badge tone={user.role === "admin" ? "purple" : "blue"}>
              {user.role === "admin" ? "Admin" : "CSM"}
            </Badge>
          </>
        )}
      </div>
    </header>
  );
}
