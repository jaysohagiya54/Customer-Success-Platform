"use client";

import React, {
  useId,
  useRef,
  useState,
  useEffect,
  KeyboardEvent,
} from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref?: any;
  onBlur?: (e: React.FocusEvent) => void;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
}

export default function Select({
  label,
  error,
  options,
  placeholder,
  value: controlledValue,
  defaultValue = "",
  disabled,
  className = "",
  id,
  name,
  onBlur,
  onChange,
  // ref intentionally ignored — custom component uses internal ref
  ref: _ref,
}: SelectProps) {
  const reactId = useId();
  const selectId = id ?? reactId;
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const allOptions: SelectOption[] = placeholder !== undefined
    ? [{ value: "", label: placeholder }, ...options]
    : options;

  const selectedLabel =
    allOptions.find((o) => o.value === currentValue)?.label ??
    (placeholder ?? "Select…");

  const isPlaceholderSelected = currentValue === "" || currentValue === undefined;

  function select(val: string) {
    if (!isControlled) setInternalValue(val);
    onChange?.({ target: { value: val, name } });
    setOpen(false);
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Keyboard navigation
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((v) => !v); }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const idx = allOptions.findIndex((o) => o.value === currentValue);
      const next = e.key === "ArrowDown"
        ? Math.min(idx + 1, allOptions.length - 1)
        : Math.max(idx - 1, 0);
      select(allOptions[next].value);
    }
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-soft">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        id={selectId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onKeyDown={onKeyDown}
        onClick={() => setOpen((v) => !v)}
        onBlur={onBlur}
        className={`flex w-full items-center justify-between rounded-[10px] border px-3.5 py-2.5 text-sm text-left focus:outline-none focus:ring-2 transition-colors ${
          error
            ? "border-red-400 focus:ring-red-400/30"
            : "border-theme focus:ring-[var(--ring)] focus:border-[var(--accent)]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        style={{ backgroundColor: "var(--bg-surface)", color: isPlaceholderSelected ? "var(--text-placeholder)" : "var(--text)" }}
      >
        <span className="truncate">{selectedLabel}</span>
        {/* Chevron */}
        <svg
          className={`shrink-0 ml-2 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: "var(--text-muted)" }}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 rounded-xl border shadow-lg overflow-hidden"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-md)",
            minWidth: containerRef.current?.offsetWidth,
            width: containerRef.current?.offsetWidth,
            top: containerRef.current
              ? containerRef.current.getBoundingClientRect().bottom + window.scrollY + 4
              : undefined,
            left: containerRef.current
              ? containerRef.current.getBoundingClientRect().left + window.scrollX
              : undefined,
            position: "fixed",
          }}
        >
          {allOptions.map((o) => {
            const active = o.value === currentValue;
            const isPlaceholderOpt = o.value === "" && placeholder !== undefined;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => select(o.value)}
                className="flex w-full items-center px-3.5 py-2.5 text-sm text-left transition-colors"
                style={{
                  backgroundColor: active ? "var(--bg-surface-2)" : "transparent",
                  color: isPlaceholderOpt
                    ? "var(--text-muted)"
                    : active
                    ? "var(--accent)"
                    : "var(--text)",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-surface-2)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                {active && (
                  <svg className="mr-2 shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    style={{ color: "var(--accent)" }} aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {!active && <span className="mr-[20px]" />}
                {o.label}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}
