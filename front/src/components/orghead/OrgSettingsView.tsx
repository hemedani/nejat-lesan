"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getOrganization } from "@/app/actions/organization/getOrganization";
import { getOrgChart } from "@/app/actions/unit/getOrgChart";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import { useOrgModules } from "@/hooks/useOrgModules";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { MODULE_KEYS, MODULE_LABELS } from "@/utils/org";
import type { OrganizationListItem, OrgChartResponse } from "@/services/org-projections";
import { orgRoutes } from "@/utils/org-routes";


/**
 * Organization settings for the OrgHead panel.
 *
 * Module licensing itself is Ghost-only (`organization.setModules`), so this
 * page is deliberately read-only: it tells the OrgHead which modules are on and
 * who to contact, instead of offering controls that would be rejected.
 */
export function OrgSettingsView({ orgId }: { orgId: string }) {
  const [org, setOrg] = useState<OrganizationListItem | null>(null);
  const [unitCount, setUnitCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loading: modulesLoading, has: orgHasModule } = useOrgModules(orgId);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const organization = unwrapApiResponse<OrganizationListItem>(
        await getOrganization({ set: { _id: orgId } }),
      );
      const chart = unwrapApiResponse<OrgChartResponse>(
        await getOrgChart({ set: { orgId }, get: { stats: 1 } }),
      );
      setOrg(organization);
      setUnitCount(
        (Array.isArray(chart.stats) ? chart.stats : []).reduce(
          (sum, item) => sum + (Number(item.count) || 0),
          0,
        ),
      );
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || modulesLoading) return <PageSkeleton blocks={[120, 180, 200]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;
  if (!org) return null;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-brand-fg">تنظیمات</p>
        <h1 className="mt-1 text-2xl font-bold text-fg">تنظیمات سازمان</h1>
        <p className="mt-2 text-sm text-fg-faint">
          مشخصات سازمان و ماژول‌های فعال. برای تغییر این موارد با مدیر سامانه تماس بگیرید.
        </p>
      </div>

      <section className="rounded-2xl border border-line bg-surface/75 p-5 shadow-xl">
        <h2 className="mb-4 font-semibold text-fg">مشخصات سازمان</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="نام سازمان" value={org.name} />
          <Field label="کد سازمان" value={org.code} mono />
          <Field label="نام لاتین" value={org.enName} mono />
          <Field
            label="وضعیت"
            value={org.is_active ? "فعال" : "غیرفعال"}
          />
          <Field
            label="جاده / آزادراه"
            value={org.road?.name || "—"}
          />
          <Field
            label="سرپرست سازمان"
            value={
              org.head
                ? `${org.head.first_name || ""} ${org.head.last_name || ""}`.trim() || "—"
                : "—"
            }
          />
          <Field label="تعداد واحدها" value={unitCount === null ? "—" : unitCount.toLocaleString("fa-IR")} />
        </dl>
        {org.description && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-xs text-fg-faint">توضیحات</p>
            <p className="mt-1 text-sm leading-6 text-fg-muted">{org.description}</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface/75 p-5 shadow-xl">
        <h2 className="mb-1 font-semibold text-fg">ماژول‌های فعال</h2>
        <p className="mb-4 text-xs text-fg-faint">
          فعال/غیرفعال کردن ماژول‌ها فقط توسط مدیر سامانه انجام می‌شود.
        </p>
        <ul className="space-y-2">
          {MODULE_KEYS.map((key) => {
            const enabled = orgHasModule(key);
            return (
              <li
                key={key}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-sunken px-4 py-3"
              >
                <span className="text-sm text-fg">{MODULE_LABELS[key]}</span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${
                    enabled
                      ? "tint-emerald border-tint-border bg-tint-soft text-tint-fg"
                      : "border-line-strong/20 bg-surface-hover text-fg-muted"
                  }`}
                >
                  {enabled ? "فعال" : "غیرفعال"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-surface/75 p-5 shadow-xl">
        <h2 className="mb-4 font-semibold text-fg">دسترسی سریع</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={orgRoutes.units()}
            className="rounded-xl border border-line-strong bg-surface-hover px-4 py-2.5 text-sm text-fg transition hover:bg-surface-hover"
          >
            مدیریت واحدها
          </Link>
          <Link
            href={orgRoutes.people()}
            className="rounded-xl border border-line-strong bg-surface-hover px-4 py-2.5 text-sm text-fg transition hover:bg-surface-hover"
          >
            افراد و نقش‌ها
          </Link>
          <Link
            href={orgRoutes.orgChart()}
            className="rounded-xl border border-line-strong bg-surface-hover px-4 py-2.5 text-sm text-fg transition hover:bg-surface-hover"
          >
            نمودار سازمانی
          </Link>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-fg-faint">{label}</dt>
      <dd
        className={`mt-1 break-words text-fg ${mono ? "font-mono text-xs" : ""}`}
        dir={mono ? "ltr" : undefined}
      >
        {value || "—"}
      </dd>
    </div>
  );
}
