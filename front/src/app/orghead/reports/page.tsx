"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { OrgReportsView } from "@/components/org/OrgReportsView";

export default function OrgHeadReportsPage() {
  return (
    <ScopedView>
      {({ orgId }) => (
        <OrgReportsView
          orgId={orgId}
          detailBase="/orghead"
          heading="گزارش‌های رخداد سازمان"
          subtitle="تمام رخدادهای ثبت‌شده روی جاده سازمان؛ برای بررسی جزئیات روی هر گزارش بزنید."
        />
      )}
    </ScopedView>
  );
}
