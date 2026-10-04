"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { OrgReportsView } from "@/components/org/OrgReportsView";
import { unitHeadRoutes } from "@/utils/unit-head-routes";

export default function UnitHeadReportsPage() {
  return (
    <ScopedView require="unit">
      {({ orgId, unitName }) => (
        <OrgReportsView
          orgId={orgId}
          detailBase={unitHeadRoutes.dashboard()}
          heading={unitName ? `رخدادهای «${unitName}»` : "رخدادهای واحد"}
          subtitle="رخدادهای ثبت‌شده روی جاده سازمان؛ برای بررسی جزئیات روی هر گزارش بزنید."
        />
      )}
    </ScopedView>
  );
}
