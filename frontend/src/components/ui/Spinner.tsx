interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-[var(--accent)] border-t-transparent ${sizes[size]} ${className}`}
    />
  );
}
