"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchMe } from "@/store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import Spinner from "@/components/ui/Spinner";

export default function AppLayout({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const status = useAppSelector((s) => s.auth.status);

  // Validate the session against the backend on mount. The auth tokens live in
  // HttpOnly cookies that JS cannot read, but they ARE sent with this request
  // (withCredentials). We rely on the /auth/me result — NOT document.cookie —
  // because cross-domain cookies are not readable by the frontend's JS.
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchMe());
    }
  }, [status, dispatch]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme">
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-theme">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-7">{children}</main>
      </div>
    </div>
  );
}
