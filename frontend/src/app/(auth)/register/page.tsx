"use client";

import { forwardRef, InputHTMLAttributes, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validation";
import { register as registerThunk, clearAuthError } from "@/store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import AuthCard from "@/components/auth/AuthCard";
import Button from "@/components/ui/Button";

/* ── always-light input for the cream card ── */
interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { label, error, ...rest },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium" style={{ color: "#4A4A48" }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full rounded-[10px] border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 ${
          error ? "border-red-400 focus:ring-red-400/30" : "focus:ring-[var(--ring)] focus:border-[var(--accent)]"
        }`}
        style={{ backgroundColor: "#fff", color: "#1a1a1a", borderColor: error ? undefined : "#E5E2DB" }}
        {...rest}
      />
      {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
});

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const error = useAppSelector((s) => s.auth.error);
  const authStatus = useAppSelector((s) => s.auth.status);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (authStatus === "authenticated") router.replace("/dashboard");
  }, [authStatus, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    dispatch(clearAuthError());
    return () => { dispatch(clearAuthError()); };
  }, [dispatch]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await dispatch(registerThunk(values)).unwrap();
      router.push("/dashboard");
    } catch {
      // error surfaced via auth.error
    }
  });

  return (
    <AuthCard title="Create your account" subtitle="Start tracking customer success today">
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
            <svg className="mt-0.5 shrink-0" style={{ color: "#ef4444" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm" style={{ color: "#b91c1c" }}>{error}</p>
          </div>
        )}

        <AuthInput
          label="Full name"
          autoComplete="name"
          placeholder="Jane Smith"
          error={errors.full_name?.message}
          {...register("full_name")}
        />

        <AuthInput
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: "#4A4A48" }}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              aria-invalid={errors.password ? true : undefined}
              className={`w-full rounded-[10px] border px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 ${
                errors.password ? "border-red-400 focus:ring-red-400/30" : "focus:ring-[var(--ring)] focus:border-[var(--accent)]"
              }`}
              style={{ backgroundColor: "#fff", color: "#1a1a1a", borderColor: errors.password ? undefined : "#E5E2DB" }}
              {...register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "#A8A8A6" }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          {errors.password && (
            <p className="text-xs" style={{ color: "#ef4444" }}>{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full mt-1 py-2.5">
          Create account
        </Button>

        <div className="relative flex items-center gap-3 py-1">
          <div className="flex-1 h-px" style={{ backgroundColor: "#E5E2DB" }} />
          <span className="text-xs" style={{ color: "#A8A8A6" }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "#E5E2DB" }} />
        </div>

        <p className="text-center text-sm" style={{ color: "#888" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium hover:opacity-80 transition-opacity" style={{ color: "var(--accent)" }}>
            Sign in instead
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
