import { normalizeReviewStatus, reviewStatusMeta, syncStatusMeta } from "@/utils/patrol-status";
import type { ReviewStatus, SyncStatus } from "@/types/patrol";

export function StatusBadge({ kind, value }: { kind: "sync" | "review"; value?: SyncStatus | ReviewStatus }) {
  const meta = kind === "sync" ? syncStatusMeta[value as SyncStatus] : reviewStatusMeta[normalizeReviewStatus(value as ReviewStatus)];
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs ${meta.className}`}>{meta.label}</span>;
}
