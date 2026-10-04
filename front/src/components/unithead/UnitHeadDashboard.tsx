"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getUnit } from "@/app/actions/unit/getUnit";
import { getInventoryRows } from "@/app/actions/inventory/gets";
import { getGoodsRequestRows } from "@/app/actions/goods_request/gets";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import { useOrgModules } from "@/hooks/useOrgModules";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { UNIT_TYPE_LABELS, UNIT_TYPE_TONES } from "@/utils/org";
import type { UnitType } from "@/services/org-projections";
import { unitHeadRoutes } from "@/utils/unit-head-routes";

interface UnitDetail {
  _id: string;
  name?: string;
  code?: string;
  type?: UnitType;
  address?: string;
  phone?: string;
  head_title?: string;
  is_active?: boolean;
  organization?: { _id?: string; name?: string };
  parentUnit?: { _id?: string; name?: string };
  head?: { _id?: string; first_name?: string; last_name?: string };
  officers?: Array<{ _id: string; first_name?: string; last_name?: string }>;
  vehicles?: Array<{ _id: string; plaque_no?: string; title?: string }>;
}

/**
 * UnitHead landing page: what the unit is, who is in it, and what needs
 * attention (low stock, pending goods requests).
 */
export function UnitHeadDashboard({
  unitId,
  orgId,
}: {
  unitId: string;
  orgId: string;
}) {
  const [unit, setUnit] = useState<UnitDetail | null>(null);
  const [lowStock, setLowStock] = useState<number | null>(null);
  const [pendingRequests, setPendingRequests] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { has: orgHasModule } = useOrgModules(orgId);

  const warehouseOn = orgHasModule("warehouse");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = unwrapApiResponse<UnitDetail>(
        await getUnit({ set: { _id: unitId } }),
      );
      setUnit(detail);

      if (warehouseOn) {
        const inventory = unwrapApiResponse<Array<{ quantity?: number; min_quantity?: number }>>(
          await getInventoryRows({ set: { unitId, limit: 300 } }),
        );
        setLowStock(
          (Array.isArray(inventory) ? inventory : []).filter(
            (row) => Number(row.quantity ?? 0) <= Number(row.min_quantity ?? 0),
          ).length,
        );

        const requests = unwrapApiResponse<unknown[]>(
          await getGoodsRequestRows({ set: { unitId, status: "pending", limit: 200 } }),
        );
        setPendingRequests(Array.isArray(requests) ? requests.length : 0);
      }
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [unitId, warehouseOn]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PageSkeleton blocks={[140, 120, 220]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;
  if (!unit) return null;

  const headName = unit.head
    ? `${unit.head.first_name || ""} ${unit.head.last_name || ""}`.trim()
    : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-l from-blue-950/70 via-slate-900 to-slate-900 p-5 shadow-xl sm:flex-row sm:items-center sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {unit.type && (
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] ${
                  UNIT_TYPE_TONES[unit.type] || UNIT_TYPE_TONES.General
                }`}
              >
                {UNIT_TYPE_LABELS[unit.type] || unit.type}
              </span>
            )}
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                unit.is_active
                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                  : "border-rose-400/25 bg-rose-400/10 text-rose-200"
              }`}
            >
              {unit.is_active ? "فعال" : "غیرفعال"}
            </span>
            {unit.code && (
              <span
                className="rounded-lg border border-white/10 bg-white/[.04] px-2 py-0.5 font-mono text-[11px] text-slate-400"
                dir="ltr"
              >
                {unit.code}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-white">{unit.name}</h1>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
            <span>
              سازمان: <span className="text-slate-200">{unit.organization?.name || "—"}</span>
            </span>
            <span>
              واحد بالادست:{" "}
              <span className="text-slate-200">{unit.parentUnit?.name || "—"}</span>
            </span>
            <span>
              سرپرست: <span className="text-slate-200">{headName || "—"}</span>
            </span>
            {unit.head_title && (
              <span>
                عنوان: <span className="text-slate-200">{unit.head_title}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={unitHeadRoutes.members()}
            className="rounded-xl border border-white/15 bg-white/[.06] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            اعضای واحد
          </Link>
          {warehouseOn && (
            <Link
              href={unitHeadRoutes.warehouse()}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,.18)] transition hover:bg-blue-500"
            >
              انبار واحد
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="اعضای واحد" value={unit.officers?.length ?? 0} />
        <Stat label="خودروهای واحد" value={unit.vehicles?.length ?? 0} />
        {warehouseOn && (
          <>
            <Stat label="اقلام زیر حد مجاز" value={lowStock} tone="amber" />
            <Stat label="درخواست‌های در انتظار" value={pendingRequests} tone="blue" />
          </>
        )}
      </div>

      {(unit.address || unit.phone) && (
        <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-xl">
          <h2 className="mb-4 font-semibold text-white">اطلاعات تماس</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">نشانی</p>
              <p className="mt-1 text-sm text-slate-200">{unit.address || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">تلفن</p>
              <p className="mt-1 text-sm text-slate-200" dir="ltr">
                {unit.phone || "—"}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number | null;
  tone?: "slate" | "amber" | "blue";
}) {
  const tones = {
    slate: "text-white",
    amber: "text-amber-200",
    blue: "text-blue-200",
  } as const;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-xl">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tones[tone]}`}>
        {value === null ? "—" : value.toLocaleString("fa-IR")}
      </p>
    </div>
  );
}
