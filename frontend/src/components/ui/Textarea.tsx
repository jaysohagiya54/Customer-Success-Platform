import { TextareaHTMLAttributes, forwardRef, useId } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className = "", ...rest },
  ref,
) {
  const reactId = useId();
  const textareaId = id ?? reactId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-soft">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
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

export default Textarea;
