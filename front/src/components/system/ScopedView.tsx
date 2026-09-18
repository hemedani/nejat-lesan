"use client";

import { usePanelScope } from "@/components/system/PanelScopeProvider";
import { PageSkeleton } from "@/components/patrol/ui";

export interface ResolvedScope {
  orgId: string;
  orgName?: string;
  unitId?: string;
  unitName?: string;
}

/**
 * Resolves the panel scope before rendering a page body.
 *
 * Pages stay thin: they hand `ScopedView` a render function and receive the
 * already-resolved org/unit ids, so no page has to know how scope is derived
 * or repeat the loading/empty handling.
 */
export function ScopedView({
  require = "org",
  children,
}: {
  /** `org` renders once an organization is known; `unit` also needs a unit. */
  require?: "org" | "unit";
  children: (scope: ResolvedScope) => React.ReactNode;
}) {
  const { ready, orgId, orgName, unitId, unitName } = usePanelScope();

  if (!ready) return <PageSkeleton blocks={[96, 180, 240]} />;

  if (require === "org" && !orgId) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.02] p-10 text-center text-sm text-slate-500">
        سازمانی برای نمایش وجود ندارد.
      </div>
    );
  }

  if (require === "unit" && (!unitId || !orgId)) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.02] p-10 text-center text-sm text-slate-500">
        واحدی به حساب شما متصل نیست. برای دسترسی به این بخش، عضویت شما در یک واحد باید توسط سرپرست سازمان ثبت شود.
      </div>
    );
  }

  return <>{children({ orgId: orgId as string, orgName, unitId, unitName })}</>;
}
