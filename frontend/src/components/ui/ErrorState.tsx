import Button from "@/components/ui/Button";

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-8 py-10 text-center">
      <p className="text-sm font-medium text-red-700 dark:text-red-400">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
