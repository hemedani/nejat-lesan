import type { ReviewAction, ReviewStatus, SyncStatus } from "@/types/patrol";

export const syncStatusMeta: Record<SyncStatus, { label: string; className: string }> = {
  draft: { label: "پیش‌نویس", className: "border-line-strong bg-line-strong/10 text-fg-muted" },
  queued: { label: "در صف همگام‌سازی", className: "tint-amber border-tint-border bg-tint-soft text-tint-fg" },
  syncing: { label: "در حال همگام‌سازی", className: "tint-blue border-tint-border bg-tint-soft text-tint-fg" },
  synced: { label: "همگام‌سازی‌شده", className: "tint-emerald border-tint-border bg-tint-soft text-tint-fg" },
  rejected: { label: "ردشده در همگام‌سازی", className: "tint-rose border-tint-border bg-tint-soft text-tint-fg" },
};

export const reviewStatusMeta: Record<ReviewStatus, { label: string; className: string }> = {
  submitted: { label: "ارسال‌شده", className: "tint-blue border-tint-border bg-tint-soft text-tint-fg" },
  under_review: { label: "در حال بررسی", className: "tint-amber border-tint-border bg-tint-soft text-tint-fg" },
  returned: { label: "برگشت برای اصلاح", className: "tint-orange border-tint-border bg-tint-soft text-tint-fg" },
  approved: { label: "تأییدشده", className: "tint-cyan border-tint-border bg-tint-soft text-tint-fg" },
  completed: { label: "تکمیل‌شده", className: "tint-emerald border-tint-border bg-tint-soft text-tint-fg" },
};

export const normalizeReviewStatus = (status?: ReviewStatus): ReviewStatus => status ?? "submitted";

export const availableReviewActions = (status?: ReviewStatus): ReviewAction[] => {
  switch (normalizeReviewStatus(status)) {
    case "submitted": return ["start_review"];
    case "under_review": return ["return", "approve"];
    case "approved": return ["complete"];
    default: return [];
  }
};

export const reviewActionLabels: Record<ReviewAction, string> = {
  start_review: "شروع بررسی",
  return: "برگشت برای اصلاح",
  approve: "تأیید گزارش",
  complete: "تکمیل گزارش",
};
