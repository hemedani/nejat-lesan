"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getInventoryRows } from "@/app/actions/inventory/gets";
import { getConsumptionRows } from "@/app/actions/consumption/gets";
import { getStockMovementRows } from "@/app/actions/stock_movement/gets";
import { getGoodsReceiptRows } from "@/app/actions/goods_receipt/gets";
import { getGoodsRequestRows } from "@/app/actions/goods_request/gets";
import { approveGoodsRequest } from "@/app/actions/goods_request/approve";
import { issueGoodsRequest } from "@/app/actions/goods_request/issue";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import { useOrgModules } from "@/hooks/useOrgModules";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { Button } from "@/components/atoms/Button";

type TabKey = "stock" | "requests" | "consumption" | "movements" | "receipts";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "stock", label: "موجودی" },
  { key: "requests", label: "درخواست‌ها" },
  { key: "consumption", label: "مصرف" },
  { key: "movements", label: "حرکت کالا" },
  { key: "receipts", label: "دریافتی‌ها" },
];

interface Ref {
  _id?: string;
  name?: string;
}
interface UserRef {
  _id?: string;
  first_name?: string;
  last_name?: string;
}

interface InventoryRow {
  _id: string;
  quantity?: number;
  min_quantity?: number;
  max_quantity?: number;
  batch_no?: string;
  expiration_date?: string;
  location?: string;
  unit?: Ref;
  ware?: Ref;
}

interface RequestRow {
  _id: string;
  quantity?: number;
  status?: string;
  priority?: string;
  notes?: string;
  ware?: Ref;
  unit?: Ref;
  requested_by?: UserRef;
}

export function InventoryClient({ orgId }: { orgId: string }) {
  const { loading: modulesLoading, has: orgHasModule } = useOrgModules(orgId);
  const [tab, setTab] = useState<TabKey>("stock");

  if (modulesLoading) return <PageSkeleton blocks={[120, 240]} />;

  if (!orgHasModule("warehouse")) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-8 text-center text-sm text-amber-100">
        ماژول انبار برای این سازمان فعال نیست.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm text-blue-300">انبار</p>
        <h1 className="mt-1 text-2xl font-bold text-white">مدیریت موجودی و انبار</h1>
        <p className="mt-2 text-sm text-slate-500">موجودی واحدها، درخواست‌ها و گردش کالای سازمان.</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              tab === t.key ? "border-blue-400/40 bg-blue-400/10 text-blue-100" : "border-white/10 text-slate-400 hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stock" && <StockView orgId={orgId} />}
      {tab === "requests" && <RequestsView />}
      {tab === "consumption" && <ConsumptionView />}
      {tab === "movements" && <MovementsView />}
      {tab === "receipts" && <ReceiptsView />}
    </div>
  );
}

function StockView({ orgId }: { orgId: string }) {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = unwrapApiResponse<InventoryRow[]>(await getInventoryRows({ set: { organizationId: orgId, limit: 300 } }));
      setRows(Array.isArray(data) ? data : []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const lowCount = rows.filter((r) => Number(r.quantity) <= Number(r.min_quantity)).length;

  if (loading) return <PageSkeleton blocks={[160]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[.02] px-4 py-3">
        <span className="text-sm font-semibold text-white">موجودی واحدها</span>
        <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
          کمبود: {lowCount.toLocaleString("fa-IR")}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-white/10 text-xs text-slate-500">
            <tr>
              {["کالا", "واحد", "موجودی", "حداقل", "شماره بچ", "انقضا", "مکان"].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {rows.map((row) => (
              <tr key={row._id}>
                <td className="px-4 py-3">{row.ware?.name || "—"}</td>
                <td className="px-4 py-3">{row.unit?.name || "—"}</td>
                <td className="px-4 py-3 font-semibold text-white">{Number(row.quantity ?? 0).toLocaleString("fa-IR")}</td>
                <td className="px-4 py-3">{Number(row.min_quantity ?? 0).toLocaleString("fa-IR")}</td>
                <td className="px-4 py-3 font-mono text-xs" dir="ltr">{row.batch_no || "—"}</td>
                <td className="px-4 py-3 text-xs">{row.expiration_date ? new Date(row.expiration_date).toLocaleDateString("fa-IR") : "—"}</td>
                <td className="px-4 py-3 text-xs">{row.location || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">موجودی‌ای ثبت نشده است.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RequestsView() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = unwrapApiResponse<RequestRow[]>(await getGoodsRequestRows({ set: { limit: 200 } }));
      setRows(Array.isArray(data) ? data : []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (fn: () => Promise<{ success: boolean; body?: unknown }>, ok: string) => {
    setBusy(true);
    try {
      const response = await fn();
      if (response.success) {
        toast.success(ok);
        await load();
      } else {
        toast.error(((response.body as { message?: string } | undefined)?.message) || "خطا در انجام عملیات.");
      }
    } catch (cause) {
      toast.error(getPatrolErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageSkeleton blocks={[160]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-500">درخواستی ثبت نشده است.</div>
      )}
      {rows.map((row) => {
        const pending = row.status === "pending";
        const approved = row.status === "approved";
        return (
          <div key={row._id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white">{row.ware?.name || "کالا"}</span>
                <span className="text-xs text-slate-400">({Number(row.quantity ?? 0).toLocaleString("fa-IR")})</span>
                <StatusPill status={row.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                واحد درخواست‌دهنده: {row.unit?.name || "—"}
                {row.requested_by?.first_name ? ` · ${row.requested_by.first_name} ${row.requested_by.last_name || ""}` : ""}
              </p>
              {row.notes && <p className="mt-1 text-xs text-slate-500">{row.notes}</p>}
            </div>
            <div className="flex shrink-0 gap-2">
              {pending && (
                <Button size="sm" variant="primary" loading={busy} disabled={busy} onClick={() => void act(() => approveGoodsRequest({ set: { _id: row._id, approve: true } }), "درخواست تأیید شد.")}>
                  تأیید
                </Button>
              )}
              {approved && (
                <Button size="sm" variant="warning" loading={busy} disabled={busy} onClick={() => void act(() => issueGoodsRequest({ set: { _id: row._id } }), "درخواست صادر شد.")}>
                  صدور
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConsumptionView() {
  return <Ledger kind="consumption" />;
}
function MovementsView() {
  return <Ledger kind="movements" />;
}
function ReceiptsView() {
  return <Ledger kind="receipts" />;
}

function Ledger({ kind }: { kind: "consumption" | "movements" | "receipts" }) {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: unknown;
      if (kind === "consumption") data = unwrapApiResponse(await getConsumptionRows({ set: { limit: 200 } }));
      else if (kind === "movements") data = unwrapApiResponse(await getStockMovementRows({ set: { limit: 200 } }));
      else data = unwrapApiResponse(await getGoodsReceiptRows({ set: { limit: 200 } }));
      setRows(Array.isArray(data) ? (data as Array<Record<string, unknown>>) : []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PageSkeleton blocks={[160]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-500">رکوردی ثبت نشده است.</div>
      )}
      {rows.map((row) => {
        const id = String((row as { _id?: string })._id || "");
        const ware = (row as { ware?: Ref }).ware?.name;
        const unit = (row as { unit?: Ref }).unit?.name ?? (row as { receiving_unit?: Ref }).receiving_unit?.name;
        const who = (row as { consumed_by?: UserRef; created_by?: UserRef; received_by?: UserRef }).consumed_by
          ?? (row as { created_by?: UserRef }).created_by;
        const qty = (row as { quantity?: number }).quantity;
        const reason = (row as { reason?: string }).reason;
        const status = (row as { status?: string }).status;
        const date = (row as { consumed_at?: string; createdAt?: string; received_at?: string }).consumed_at
          ?? (row as { createdAt?: string }).createdAt
          ?? (row as { received_at?: string }).received_at;
        const receiptNo = (row as { receipt_number?: string }).receipt_number;
        const notes = (row as { notes?: string }).notes;
        return (
          <div key={id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="font-medium text-white">{ware || "کالا"}</span>
              {qty !== undefined && <span className="font-mono text-xs text-slate-400">{Number(qty).toLocaleString("fa-IR")}</span>}
              {receiptNo && <span className="font-mono text-xs text-slate-400" dir="ltr">{receiptNo}</span>}
              {unit && <span className="text-xs text-slate-500">{unit}</span>}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {reason && <span>{reason}</span>}
              {status && <StatusPill status={status} />}
              {who?.first_name && <span>{who.first_name} {who.last_name || ""}</span>}
              {date && <span>{new Date(date).toLocaleDateString("fa-IR")}</span>}
              {notes && <span className="max-w-[180px] truncate">{notes}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status?: string }) {
  const tone =
    status === "active" || status === "approved" || status === "issued" || status === "completed" || status === "received"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
      : status === "pending" || status === "draft"
        ? "border-amber-400/25 bg-amber-400/10 text-amber-200"
        : status === "rejected"
          ? "border-rose-400/25 bg-rose-400/10 text-rose-200"
          : "border-white/10 bg-white/[.04] text-slate-300";
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] ${tone}`}>{status || "—"}</span>;
}
