"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getOrgChart } from "@/app/actions/unit/getOrgChart";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import {
  buildUnitTree,
  type OrgChartResponse,
  type OrgChartUnit,
  type OrgChartStats,
  type TreeNode,
  type UnitType,
} from "@/services/org-projections";
import { UNIT_TYPE_LABELS, UNIT_TYPE_TONES } from "@/utils/org";
import { Button } from "@/components/atoms/Button";
import ToggleSwitch from "@/components/atoms/ToggleSwitch";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";

type UnitNode = TreeNode<OrgChartUnit>;

export function OrgChartView({ orgId }: { orgId: string }) {
  const [units, setUnits] = useState<OrgChartUnit[]>([]);
  const [stats, setStats] = useState<OrgChartStats | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const chart = unwrapApiResponse<OrgChartResponse>(
        await getOrgChart({ set: { orgId }, get: { units: 1, organization: 1, stats: 1 } }),
      );
      setUnits(Array.isArray(chart.units) ? chart.units : []);
      setStats(Array.isArray(chart.stats) ? chart.stats : null);
      setOrgName(chart.organization?.name || null);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const roots = useMemo<UnitNode[]>(() => buildUnitTree<OrgChartUnit>(units), [units]);

  const visibleRoots = useMemo(() => {
    if (showInactive) return roots;
    const prune = (node: UnitNode): UnitNode | null => {
      const children = node.children.map(prune).filter((child): child is UnitNode => child !== null);
      if (node.is_active === false && children.length === 0) return null;
      return { ...node, children };
    };
    return roots.map(prune).filter((node): node is UnitNode => node !== null);
  }, [roots, showInactive]);

  if (loading) return <PageSkeleton blocks={[96, 320]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-blue-300">نمودار سازمانی</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{orgName ? `نمودار سازمانی «${orgName}»` : "نمودار سازمانی"}</h1>
          <p className="mt-2 text-sm text-slate-500">سلسله‌مراتب واحدها؛ ریشه همان واحد «ستاد» است که زیرمجموعه‌ها زیر آن قرار می‌گیرند.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => void load()} loading={loading} disabled={loading}>
            تازه‌سازی
          </Button>
          <Link href={`/org/${orgId}/units/new`} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
            + واحد جدید
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ToggleSwitch checked={showStats} onChange={setShowStats} />
            آمار بر اساس نوع واحد
          </div>
          <div className="flex items-center gap-2">
            <ToggleSwitch checked={showInactive} onChange={setShowInactive} />
            نمایش واحدهای غیرفعال
          </div>
        </div>
        <span className="text-xs text-slate-500">{units.length.toLocaleString("fa-IR")} واحد</span>
      </div>

      {showStats && stats && stats.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {stats.map((item) => (
            <span key={item._id} className={`rounded-full border px-3 py-1.5 text-xs ${UNIT_TYPE_TONES[item._id as UnitType] || UNIT_TYPE_TONES.General}`}>
              {UNIT_TYPE_LABELS[item._id as UnitType] || item._id} · {Number(item.count).toLocaleString("fa-IR")}
            </span>
          ))}
        </div>
      )}

      {visibleRoots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.02] p-10 text-center">
          <p className="text-sm text-slate-300">
            {units.length === 0 ? "این سازمان هنوز واحدی ندارد." : "هیچ واحدی برای نمایش وجود ندارد."}
          </p>
          {units.length === 0 ? (
            <Link href={`/org/${orgId}/units/new`} className="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500">
              ایجاد اولین واحد
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleRoots.map((node) => (
            <OrgTreeNode key={node._id} node={node} orgId={orgId} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrgTreeNode({ node, orgId, depth }: { node: UnitNode; orgId: string; depth: number }) {
  return (
    <div className={depth === 0 ? "" : "mr-4 border-r border-white/10 pr-4 sm:mr-6 sm:pr-6"}>
      <NodeCard node={node} orgId={orgId} />
      {node.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => (
            <OrgTreeNode key={child._id} node={child} orgId={orgId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function NodeCard({ node, orgId }: { node: UnitNode; orgId: string }) {
  const inactive = node.is_active === false;
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-lg transition sm:flex-row sm:items-center ${inactive ? "border-white/5 bg-slate-900/40 opacity-70" : "border-white/10 bg-slate-900/70 hover:border-blue-400/25"}`}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm ${UNIT_TYPE_TONES[node.type]}`}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">{node.name}</span>
            {node.code && <span className="rounded-md border border-white/10 bg-white/[.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-400" dir="ltr">{node.code}</span>}
            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${UNIT_TYPE_TONES[node.type]}`}>
              {UNIT_TYPE_LABELS[node.type] || node.type}
            </span>
            {inactive && (
              <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-2 py-0.5 text-[10px] text-rose-200">غیرفعال</span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            سرپرست:{" "}
            <span className="text-slate-200">
              {node.head ? `${node.head.first_name || ""} ${node.head.last_name || ""}`.trim() || "—" : node.head_title || "—"}
            </span>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link href={`/org/${orgId}/units/${node._id}`} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white">
          ویرایش واحد
        </Link>
        {node.children.length > 0 && <span className="text-xs text-slate-500">{node.children.length.toLocaleString("fa-IR")} زیرمجموعه</span>}
      </div>
    </div>
  );
}
