"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { OrgReportsView } from "@/components/org/OrgReportsView";
import { orgRoutes } from "@/utils/org-routes";

export default function OrgHeadReportsPage() {
  return (
    <ScopedView>
      {({ orgId }) => (
        <OrgReportsView
          orgId={orgId}
          detailBase={orgRoutes.dashboard()}
          heading="گزارش‌های رخداد سازمان"
          subtitle="تمام رخدادهای ثبت‌شده روی جاده سازمان؛ برای بررسی جزئیات روی هر گزارش بزنید."
        />
      )}
    </ScopedView>
  );
}
