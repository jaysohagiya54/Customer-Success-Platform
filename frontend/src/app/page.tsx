"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchMe } from "@/store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Spinner from "@/components/ui/Spinner";

export default function RootPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);

  // Ask the backend whether the HttpOnly session cookie is valid. We can't read
  // that cookie from JS (it's HttpOnly and cross-domain), so probe /auth/me.
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchMe());
    }
  }, [status, dispatch]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
