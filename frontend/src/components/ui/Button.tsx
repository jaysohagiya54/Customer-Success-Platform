import { ButtonHTMLAttributes, forwardRef } from "react";
import Spinner from "@/components/ui/Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] focus-visible:ring-[var(--ring)] disabled:opacity-50",
  secondary:
    "bg-surface text-theme border border-theme hover:bg-surface-2 focus-visible:ring-[var(--ring)]",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400/40 disabled:opacity-50",
  ghost:
    "bg-transparent text-soft hover:bg-surface-2 hover:text-theme focus-visible:ring-[var(--ring)]",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, disabled, className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && <Spinner size="sm" className="text-current" />}
      {children}
    </button>
  );
});

export default Button;
