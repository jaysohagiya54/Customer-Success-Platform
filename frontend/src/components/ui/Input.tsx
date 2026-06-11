import { InputHTMLAttributes, forwardRef, useId } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = "", ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-soft">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={`rounded-[10px] border bg-surface px-3.5 py-2.5 text-sm text-theme placeholder:text-placeholder focus:outline-none focus:ring-2 ${
          error
            ? "border-red-400 focus:ring-red-400/30"
            : "border-theme focus:ring-[var(--ring)] focus:border-[var(--accent)]"
        } ${className}`}
        {...rest}
      />
      {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
});

export default Input;
