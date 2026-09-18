"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { OrgReportsView } from "@/components/org/OrgReportsView";

export default function UnitHeadReportsPage() {
  return (
    <ScopedView require="unit">
      {({ orgId, unitName }) => (
        <OrgReportsView
          orgId={orgId}
          detailBase="/unit-head"
          heading={unitName ? `رخدادهای «${unitName}»` : "رخدادهای واحد"}
          subtitle="رخدادهای ثبت‌شده روی جاده سازمان؛ برای بررسی جزئیات روی هر گزارش بزنید."
        />
      )}
    </ScopedView>
  );
}
