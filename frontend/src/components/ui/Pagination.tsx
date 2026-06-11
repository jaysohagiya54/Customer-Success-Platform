import Button from "@/components/ui/Button";

export interface PaginationProps {
  page: number;
  pages: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function Pagination({ page, pages, onPrev, onNext }: PaginationProps) {
  const safePages = Math.max(pages, 1);
  return (
    <div className="flex items-center justify-between gap-4">
      <Button variant="secondary" size="sm" onClick={onPrev} disabled={page <= 1}>
        ← Prev
      </Button>
      <span className="text-sm text-muted">
        Page {page} of {safePages}
      </span>
      <Button variant="secondary" size="sm" onClick={onNext} disabled={page >= safePages}>
        Next →
      </Button>
    </div>
  );
}
