"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUnit } from "@/app/actions/unit/getUnit";
import { getInventoryRows } from "@/app/actions/inventory/gets";
import { getGoodsRequestRows } from "@/app/actions/goods_request/gets";
import { getReporterDashboard } from "@/app/actions/accident/getReporterDashboard";
import { unwrapApiResponse } from "@/utils/api-response";
import { useOrgModules } from "@/hooks/useOrgModules";
import { PageSkeleton } from "@/components/patrol/ui";
import { UNIT_TYPE_LABELS, UNIT_TYPE_TONES } from "@/utils/org";
import type { UnitType } from "@/services/org-projections";
import { employeeRoutes } from "@/utils/employee-routes";

interface UnitDetail {
  _id: string;
  name?: string;
  code?: string;
  type?: UnitType;
  address?: string;
  phone?: string;
  organization?: { _id?: string; name?: string };
  head?: { first_name?: string; last_name?: string };
}

/**
 * Employee landing page.
 *
 * Deliberately tolerant: each card loads independently and silently, so a user
 * who has warehouse access but not the patrol module (or vice versa) still gets
 * a useful page instead of an error wall.
 */
export function EmployeeDashboard({
  unitId,
  orgId,
}: {
  unitId: string;
  orgId: string;
}) {
  const { userLevel, userData } = useAuth();
  const { has: orgHasModule, loading: modulesLoading } = useOrgModules(orgId);

  const [unit, setUnit] = useState<UnitDetail | null>(null);
  const [lowStock, setLowStock] = useState<number | null>(null);
  const [openRequests, setOpenRequests] = useState<number | null>(null);
  const [myReports, setMyReports] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const isPatrol = userLevel === "Patrol";
  const warehouseOn = orgHasModule("warehouse");
  const patrolOn = orgHasModule("incident_patrol");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await getUnit({ set: { _id: unitId } });
      setUnit(unwrapApiResponse<UnitDetail>(detail));
    } catch {
      setUnit(null);
    }

    if (warehouseOn) {
      try {
        const inventory = unwrapApiResponse<Array<{ quantity?: number; min_quantity?: number }>>(
          await getInventoryRows({ set: { unitId, limit: 300 } }),
        );
        setLowStock(
          (Array.isArray(inventory) ? inventory : []).filter(
            (row) => Number(row.quantity ?? 0) <= Number(row.min_quantity ?? 0),
          ).length,
        );
      } catch {
        setLowStock(null);
      }

      try {
        const requests = unwrapApiResponse<unknown[]>(
          await getGoodsRequestRows({ set: { unitId, limit: 200 } }),
        );
        setOpenRequests(
          (Array.isArray(requests) ? requests : []).filter((row) => {
            const status = (row as { status?: string }).status;
            return status === "pending" || status === "approved" || status === "issued";
          }).length,
        );
      } catch {
        setOpenRequests(null);
      }
    }

    if (patrolOn && isPatrol) {
      try {
        const body = unwrapApiResponse<{ recentReports?: unknown[] }>(
          await getReporterDashboard({ set: { page: 1, limit: 50 } }),
        );
        setMyReports(Array.isArray(body.recentReports) ? body.recentReports.length : 0);
      } catch {
        setMyReports(null);
      }
    }

    setLoading(false);
  }, [unitId, warehouseOn, patrolOn, isPatrol]);

  useEffect(() => {
    if (modulesLoading) return;
    void load();
  }, [load, modulesLoading]);

  const name = [userData?.first_name, userData?.last_name].filter(Boolean).join(" ") || "کاربر";

  if (loading || modulesLoading) return <PageSkeleton blocks={[140, 120, 200]} />;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line [background-image:var(--hero-gradient)] p-5 shadow-xl sm:p-6">
        <p className="text-sm text-brand-fg">پنل کارمند</p>
        <h1 className="mt-1 text-2xl font-bold text-fg">خوش آمدید، {name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-muted">
          از این پنل به انبار واحد خود دسترسی دارید و می‌توانید مصرف ثبت کنید،
          درخواست کالا بدهید و در صورت داشتن نقش گشت، رخدادهای خود را پیگیری کنید.
        </p>

        {unit && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            {unit.type && (
              <span
                className={`rounded-full border px-2.5 py-1 ${
                  UNIT_TYPE_TONES[unit.type] || UNIT_TYPE_TONES.General
                }`}
              >
                {UNIT_TYPE_LABELS[unit.type] || unit.type}
              </span>
            )}
            <span>
              واحد: <span className="text-fg">{unit.name || "—"}</span>
            </span>
            <span>
              سازمان: <span className="text-fg">{unit.organization?.name || "—"}</span>
            </span>
            {unit.head && (
              <span>
                سرپرست واحد:{" "}
                <span className="text-fg">
                  {`${unit.head.first_name || ""} ${unit.head.last_name || ""}`.trim() || "—"}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {warehouseOn && (
          <>
            <Link
              href={employeeRoutes.warehouse()}
              className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand shadow-[0_0_20px_rgba(37,99,235,.18)] transition hover:bg-brand-hover"
            >
              انبار واحد من
            </Link>
          </>
        )}
        {patrolOn && isPatrol && (
          <>
            <Link
              href={employeeRoutes.reports()}
              className="rounded-xl border border-line-strong bg-surface-hover px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface-hover"
            >
              رخدادهای من
            </Link>
            <Link
              href={employeeRoutes.map()}
              className="rounded-xl border border-line-strong bg-surface-hover px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface-hover"
            >
              نقشه حوادث
            </Link>
            <Link
              href={employeeRoutes.announcements()}
              className="rounded-xl border border-line-strong bg-surface-hover px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface-hover"
            >
              اطلاعیه‌ها
            </Link>
          </>
        )}
      </div>

      {(warehouseOn || (patrolOn && isPatrol)) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouseOn && (
            <>
              <Stat label="اقلام زیر حد مجاز در واحد" value={lowStock} tone="amber" />
              <Stat label="درخواست‌های باز واحد" value={openRequests} tone="blue" />
            </>
          )}
          {patrolOn && isPatrol && (
            <Stat label="رخدادهای ثبت‌شده من" value={myReports} />
          )}
        </div>
      )}

      {!warehouseOn && !(patrolOn && isPatrol) && (
        <div className="tint-amber rounded-2xl border border-tint-border bg-tint-soft p-6 text-sm leading-6 text-tint-fg">
          هیچ ماژولی برای این سازمان فعال نیست. برای فعال‌سازی انبار یا ماژول گشت با
          سرپرست سازمان تماس بگیرید.
        </div>
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
    slate: "text-fg",
    amber: "text-warning-fg",
    blue: "text-brand-fg",
  } as const;

  return (
    <div className="rounded-2xl border border-line bg-surface/75 p-5 shadow-xl">
      <p className="text-xs text-fg-faint">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tones[tone]}`}>
        {value === null ? "—" : value.toLocaleString("fa-IR")}
      </p>
    </div>
  );
}
