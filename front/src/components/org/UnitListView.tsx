"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getUnits } from "@/app/actions/unit/getUnits";
import { removeUnit } from "@/app/actions/unit/removeUnit";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { UnitListItem, UnitType } from "@/services/org-projections";
import { UNIT_TYPE_LABELS, UNIT_TYPE_TONES } from "@/utils/org";
import { Button } from "@/components/atoms/Button";
import { EmptyState, PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { OrgFilterSelect } from "@/components/org/OrgSelect";

export function UnitListView({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = unwrapApiResponse<UnitListItem[]>(await getUnits({ set: { organizationId: orgId, limit: 200 } }));
      setUnits(Array.isArray(data) ? data : []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return units.filter((unit) => {
      if (typeFilter !== "all" && unit.type !== typeFilter) return false;
      if (!q) return true;
      return unit.name?.toLowerCase().includes(q) || unit.code?.toLowerCase().includes(q);
    });
  }, [units, query, typeFilter]);

  const handleRemove = async (unit: UnitListItem) => {
    if (!window.confirm(`حذف واحد «${unit.name}»؟ اگر واحد زیرمجموعه دارد ابتدا آن‌ها را جابه‌جا یا حذف کنید.`)) return;
    const response = await removeUnit({ set: { _id: unit._id } });
    if (response.success) {
      toast.success("واحد حذف شد.");
      await load();
    } else {
      const message = (response.body as { message?: string } | undefined)?.message || "";
      toast.error(getPatrolErrorMessage(new Error(message)));
    }
  };

  const typeOptions = [
    { value: "all", label: "همه انواع" },
    ...(Object.keys(UNIT_TYPE_LABELS) as UnitType[]).map((type) => ({ value: type, label: UNIT_TYPE_LABELS[type] })),
  ];

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-blue-300">واحدهای سازمان</p>
          <h1 className="mt-1 text-2xl font-bold text-white">مدیریت واحدها</h1>
          <p className="mt-2 text-sm text-slate-500">واحدها ساختار درخت سازمانی را می‌سازند؛ از گشت تا پاسگاه و واحدهای ستادی.</p>
        </div>
        <Link href={`/org/${orgId}/units/new`} className="rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,.18)] transition hover:bg-blue-500">
          + واحد جدید
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m20 20-3.5-3.5" /></svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو بر اساس کد یا نام..."
            className="w-full rounded-xl border border-white/10 bg-white/[.04] py-2.5 pl-3 pr-10 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50"
          />
        </div>
        <OrgFilterSelect value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
      </div>

      {loading ? (
        <PageSkeleton blocks={[120, 120]} />
      ) : error ? (
        <RetryErrorBox message={error} onRetry={() => void load()} />
      ) : filtered.length === 0 ? (
        <EmptyState message="واحدی یافت نشد. اولین واحد را ایجاد کنید." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl">
          <div className="hidden grid-cols-12 gap-3 border-b border-white/10 bg-white/[.02] px-4 py-3 text-xs text-slate-400 md:grid">
            <span className="col-span-4">واحد</span>
            <span className="col-span-2">نوع</span>
            <span className="col-span-3">سرپرست</span>
            <span className="col-span-2">زیرمجموعه</span>
            <span className="col-span-1">وضعیت</span>
          </div>
          <div className="divide-y divide-white/5">
            {filtered.map((unit) => {
              const parentName = unit.parentUnit?.name;
              return (
                <div key={unit._id} className="grid grid-cols-1 gap-3 px-4 py-3 transition hover:bg-white/[.02] md:grid-cols-12 md:items-center">
                  <div className="col-span-4 flex min-w-0 flex-col md:flex-row md:items-center md:gap-3">
                    <button onClick={() => router.push(`/org/${orgId}/units/${unit._id}`)} className="min-w-0 text-right">
                      <span className="block truncate font-semibold text-white hover:text-blue-200">{unit.name}</span>
                      <span className="mt-0.5 block font-mono text-[10px] text-slate-500" dir="ltr">{unit.code}</span>
                    </button>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${UNIT_TYPE_TONES[unit.type] || UNIT_TYPE_TONES.General}`}>
                      {UNIT_TYPE_LABELS[unit.type] || unit.type}
                    </span>
                  </div>
                  <div className="col-span-3 text-xs text-slate-400">
                    {unit.head ? `${unit.head.first_name || ""} ${unit.head.last_name || ""}`.trim() || "—" : "—"}
                  </div>
                  <div className="col-span-2 truncate text-xs text-slate-400">{parentName || "ریشه (ستاد)"}</div>
                  <div className="col-span-1">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${unit.is_active ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-rose-400/25 bg-rose-400/10 text-rose-200"}`}>
                      {unit.is_active ? "فعال" : "غیرفعال"}
                    </span>
                  </div>
                  <div className="col-span-12 flex justify-end gap-2 border-t border-white/5 pt-2 md:col-span-12 md:border-t-0 md:pt-0">
                    <Link href={`/org/${orgId}/units/${unit._id}`} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white">ویرایش</Link>
                    <Button variant="danger" size="sm" onClick={() => void handleRemove(unit)}>حذف</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
