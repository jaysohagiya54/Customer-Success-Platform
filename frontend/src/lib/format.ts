// Pure date/string formatting helpers. No side effects, no network.

/** Format an ISO timestamp as a human-readable date, e.g. "Jun 10, 2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format an ISO timestamp as date + time, e.g. "Jun 10, 2026, 2:30 PM". */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Convert an ISO timestamp to a value usable by an <input type="datetime-local">.
 * Produces "YYYY-MM-DDTHH:mm" in the user's local time zone.
 */
export function isoToDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/**
 * Convert a datetime-local input value ("YYYY-MM-DDTHH:mm") to an ISO string.
 * Returns "" for empty input. Treats the value as local time.
 */
export function dateTimeLocalToIso(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}
