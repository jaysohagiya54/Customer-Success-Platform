import { HTMLAttributes } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export default function Card({ className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-theme bg-surface ${className}`}
      style={{ boxShadow: "var(--shadow-sm)" }}
      {...rest}
    >
      {children}
    </div>
  );
}
