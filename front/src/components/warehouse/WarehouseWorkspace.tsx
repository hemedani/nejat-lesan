"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getInventoryRows } from "@/app/actions/inventory/gets";
import { getConsumptionRows } from "@/app/actions/consumption/gets";
import { getStockMovementRows } from "@/app/actions/stock_movement/gets";
import { getGoodsReceiptRows } from "@/app/actions/goods_receipt/gets";
import { getGoodsRequestRows } from "@/app/actions/goods_request/gets";
import { approveGoodsRequest } from "@/app/actions/goods_request/approve";
import { issueGoodsRequest } from "@/app/actions/goods_request/issue";
import { receiveGoodsRequest } from "@/app/actions/goods_request/receive";
import { checkReorder } from "@/app/actions/inventory/checkReorder";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import { useOrgModules } from "@/hooks/useOrgModules";
import { PageSkeleton, RetryErrorBox, EmptyState } from "@/components/patrol/ui";
import { Button } from "@/components/atoms/Button";
import {
  AdjustStockForm,
  ConsumptionForm,
  GoodsReceiptForm,
  GoodsRequestForm,
  TransferForm,
} from "@/components/warehouse/WarehouseForms";

/**
 * Warehouse workspace.
 *
 * One component, three capability profiles:
 *   oversight — OrgHead: organization-wide stock, reorder sweep, transfers
 *   unit      — UnitHead: unit stock, goods receipts, approve/issue requests
 *   employee  — Employee: unit stock, consumption, raise and receive requests
 *
 * The backend already scopes reads/writes by the caller's org/unit roles, so the
 * profiles here control *affordances*, not security.
 */

export type WarehouseMode = "oversight" | "unit" | "employee";

type TabKey = "stock" | "requests" | "consumption" | "movements" | "receipts";

const TAB_LABELS: Record<TabKey, string> = {
  stock: "موجودی",
  requests: "درخواست‌ها",
  consumption: "مصرف",
  movements: "گردش کالا",
  receipts: "دریافتی‌ها",
};

const TABS_BY_MODE: Record<WarehouseMode, TabKey[]> = {
  oversight: ["stock", "requests", "consumption", "movements", "receipts"],
  unit: ["stock", "requests", "consumption", "receipts", "movements"],
  employee: ["stock", "requests", "consumption", "receipts"],
};

const HEADINGS: Record<WarehouseMode, { title: string; subtitle: string }> = {
  oversight: {
    title: "انبار و موجودی سازمان",
    subtitle: "موجودی همه واحدها، کمبودها، انتقال کالا و گردش انبار.",
  },
  unit: {
    title: "انبار واحد",
    subtitle: "موجودی واحد تحت سرپرستی، رسید کالا و رسیدگی به درخواست‌ها.",
  },
  employee: {
    title: "انبار واحد من",
    subtitle: "مشاهده موجودی، ثبت مصرف و پیگیری درخواست کالا.",
  },
};

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
  priority?: boolean;
  notes?: string;
  ware?: Ref;
  unit?: Ref;
  requested_by?: UserRef;
}

type Modal =
  | { kind: "consumption" }
  | { kind: "request" }
  | { kind: "receipt" }
  | { kind: "transfer" }
  | { kind: "adjust"; row: InventoryRow }
  | null;

export function WarehouseWorkspace({
  mode,
  orgId,
  unitId,
}: {
  mode: WarehouseMode;
  orgId?: string;
  unitId?: string;
}) {
  const { loading: modulesLoading, has: orgHasModule } = useOrgModules(orgId);
  const [tab, setTab] = useState<TabKey>("stock");
  const [modal, setModal] = useState<Modal>(null);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  // Reads are scoped to the unit for unit-level profiles, to the whole org for oversight.
  // Memoized on primitives so child loaders do not refetch on every render.
  const scopeSet = useMemo<Record<string, unknown>>(
    () => (mode === "oversight" ? { organizationId: orgId } : { unitId }),
    [mode, orgId, unitId],
  );

  if (modulesLoading) return <PageSkeleton blocks={[120, 240]} />;

  if (orgId && !orgHasModule("warehouse")) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-8 text-center text-sm text-amber-100">
        ماژول مدیریت انبار برای این سازمان فعال نیست.
      </div>
    );
  }

  const runRequestAction = async (
    run: () => Promise<{ success: boolean; body?: unknown }>,
    message: string,
  ) => {
    setBusy(true);
    try {
      const response = await run();
      if (response.success) {
        toast.success(message);
        reload();
      } else {
        toast.error(
          (response.body as { message?: string } | undefined)?.message ||
            "خطا در انجام عملیات.",
        );
      }
    } catch (cause) {
      toast.error(getPatrolErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const runReorder = async () => {
    setBusy(true);
    try {
      const response = await checkReorder({ set: { organizationId: orgId } });
      if (response.success) {
        const created = (response.body as { created?: number } | undefined)?.created ?? 0;
        toast.success(
          created > 0
            ? `${created.toLocaleString("fa-IR")} درخواست کمبود ایجاد شد.`
            : "کمبودی برای ثبت وجود ندارد.",
        );
        reload();
      } else {
        toast.error(
          (response.body as { message?: string } | undefined)?.message ||
            "خطا در بررسی کمبود.",
        );
      }
    } catch (cause) {
      toast.error(getPatrolErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const heading = HEADINGS[mode];
  const tabs = TABS_BY_MODE[mode];

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-l from-blue-950/60 via-slate-900 to-slate-900 p-5 shadow-xl sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="text-sm text-blue-300">انبار</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{heading.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {heading.subtitle}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {mode === "employee" && (
            <>
              <Button variant="secondary" onClick={() => setModal({ kind: "consumption" })}>
                ثبت مصرف
              </Button>
              <Button onClick={() => setModal({ kind: "request" })}>درخواست کالا</Button>
            </>
          )}
          {mode === "unit" && (
            <>
              <Button variant="secondary" onClick={() => setModal({ kind: "consumption" })}>
                ثبت مصرف
              </Button>
              <Button onClick={() => setModal({ kind: "receipt" })}>ثبت رسید کالا</Button>
            </>
          )}
          {mode === "oversight" && (
            <>
              <Button
                variant="secondary"
                loading={busy}
                disabled={busy}
                onClick={() => void runReorder()}
              >
                بررسی کمبود
              </Button>
              <Button onClick={() => setModal({ kind: "transfer" })}>انتقال کالا</Button>
            </>
          )}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              tab === key
                ? "border-blue-400/40 bg-blue-400/10 text-blue-100"
                : "border-white/10 text-slate-400 hover:bg-white/5"
            }`}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      {tab === "stock" && (
        <StockTable
          key={`stock-${version}`}
          scopeSet={scopeSet}
          canAdjust={mode !== "employee"}
          onAdjust={(row) => setModal({ kind: "adjust", row })}
        />
      )}
      {tab === "requests" && (
        <RequestsList
          key={`requests-${version}`}
          scopeSet={scopeSet}
          mode={mode}
          busy={busy}
          onAction={runRequestAction}
        />
      )}
      {tab === "consumption" && (
        <LedgerTable key={`consumption-${version}`} kind="consumption" scopeSet={scopeSet} />
      )}
      {tab === "movements" && (
        <LedgerTable key={`movements-${version}`} kind="movements" scopeSet={scopeSet} />
      )}
      {tab === "receipts" && (
        <LedgerTable key={`receipts-${version}`} kind="receipts" scopeSet={scopeSet} />
      )}

      {modal?.kind === "consumption" && unitId && (
        <ConsumptionForm
          unitId={unitId}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
          }}
        />
      )}
      {modal?.kind === "request" && unitId && (
        <GoodsRequestForm
          unitId={unitId}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
          }}
        />
      )}
      {modal?.kind === "receipt" && unitId && (
        <GoodsReceiptForm
          receivingUnitId={unitId}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
          }}
        />
      )}
      {modal?.kind === "transfer" && orgId && (
        <TransferForm
          orgId={orgId}
          defaultFromUnitId={unitId}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
          }}
        />
      )}
      {modal?.kind === "adjust" && unitId && (
        <AdjustStockForm
          unitId={unitId}
          wareId={modal.row.ware?._id || ""}
          wareName={modal.row.ware?.name || "کالا"}
          currentQuantity={Number(modal.row.quantity ?? 0)}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function StockTable({
  scopeSet,
  canAdjust,
  onAdjust,
}: {
  scopeSet: Record<string, unknown>;
  canAdjust: boolean;
  onAdjust: (row: InventoryRow) => void;
}) {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = unwrapApiResponse<InventoryRow[]>(
        await getInventoryRows({ set: { limit: 300, ...scopeSet } }),
      );
      setRows(Array.isArray(data) ? data : []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [scopeSet]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PageSkeleton blocks={[180]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;
  if (rows.length === 0) return <EmptyState message="موجودی‌ای ثبت نشده است." />;

  const lowCount = rows.filter(
    (row) => Number(row.quantity ?? 0) <= Number(row.min_quantity ?? 0),
  ).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[.02] px-4 py-3">
        <span className="text-sm font-semibold text-white">
          موجودی ({rows.length.toLocaleString("fa-IR")} قلم)
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-xs ${
            lowCount > 0
              ? "border-amber-400/25 bg-amber-400/10 text-amber-200"
              : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
          }`}
        >
          زیر حد مجاز: {lowCount.toLocaleString("fa-IR")}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-white/10 text-xs text-slate-500">
            <tr>
              {["کالا", "واحد", "موجودی", "حداقل", "مکان", "انقضا", ""].map((header) => (
                <th key={header} className="whitespace-nowrap px-4 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {rows.map((row) => {
              const low = Number(row.quantity ?? 0) <= Number(row.min_quantity ?? 0);
              return (
                <tr key={row._id} className={low ? "bg-amber-400/[.04]" : undefined}>
                  <td className="px-4 py-3">{row.ware?.name || "—"}</td>
                  <td className="px-4 py-3">{row.unit?.name || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-white">
                    {Number(row.quantity ?? 0).toLocaleString("fa-IR")}
                  </td>
                  <td className="px-4 py-3">
                    {Number(row.min_quantity ?? 0).toLocaleString("fa-IR")}
                  </td>
                  <td className="px-4 py-3 text-xs">{row.location || "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    {row.expiration_date
                      ? new Date(row.expiration_date).toLocaleDateString("fa-IR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-left">
                    {canAdjust && row.ware?._id && (
                      <button
                        type="button"
                        onClick={() => onAdjust(row)}
                        className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/5"
                      >
                        اصلاح
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RequestsList({
  scopeSet,
  mode,
  busy,
  onAction,
}: {
  scopeSet: Record<string, unknown>;
  mode: WarehouseMode;
  busy: boolean;
  onAction: (
    run: () => Promise<{ success: boolean; body?: unknown }>,
    message: string,
  ) => Promise<void>;
}) {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = unwrapApiResponse<RequestRow[]>(
        await getGoodsRequestRows({ set: { limit: 200, ...scopeSet } }),
      );
      setRows(Array.isArray(data) ? data : []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [scopeSet]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PageSkeleton blocks={[180]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;
  if (rows.length === 0) return <EmptyState message="درخواستی ثبت نشده است." />;

  const canApprove = mode === "unit" || mode === "oversight";
  const canReceive = mode === "employee" || mode === "unit";

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const pending = row.status === "pending";
        const approved = row.status === "approved";
        const issued = row.status === "issued";

        return (
          <div
            key={row._id}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white">{row.ware?.name || "کالا"}</span>
                <span className="text-xs text-slate-400">
                  ({Number(row.quantity ?? 0).toLocaleString("fa-IR")})
                </span>
                {row.priority && (
                  <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-2 py-0.5 text-[10px] text-rose-200">
                    فوری
                  </span>
                )}
                <StatusPill status={row.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                واحد: {row.unit?.name || "—"}
                {row.requested_by?.first_name
                  ? ` · ${row.requested_by.first_name} ${row.requested_by.last_name || ""}`
                  : ""}
              </p>
              {row.notes && <p className="mt-1 text-xs text-slate-500">{row.notes}</p>}
            </div>

            <div className="flex shrink-0 gap-2">
              {canApprove && pending && (
                <>
                  <Button
                    size="sm"
                    loading={busy}
                    disabled={busy}
                    onClick={() =>
                      void onAction(
                        () => approveGoodsRequest({ set: { _id: row._id, approve: true } }),
                        "درخواست تأیید شد.",
                      )
                    }
                  >
                    تأیید
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={busy}
                    disabled={busy}
                    onClick={() =>
                      void onAction(
                        () => approveGoodsRequest({ set: { _id: row._id, approve: false } }),
                        "درخواست رد شد.",
                      )
                    }
                  >
                    رد
                  </Button>
                </>
              )}
              {canApprove && approved && (
                <Button
                  size="sm"
                  variant="warning"
                  loading={busy}
                  disabled={busy}
                  onClick={() =>
                    void onAction(
                      () => issueGoodsRequest({ set: { _id: row._id } }),
                      "کالا صادر شد.",
                    )
                  }
                >
                  صدور
                </Button>
              )}
              {canReceive && issued && (
                <Button
                  size="sm"
                  loading={busy}
                  disabled={busy}
                  onClick={() =>
                    void onAction(
                      () => receiveGoodsRequest({ set: { _id: row._id } }),
                      "تحویل تأیید شد.",
                    )
                  }
                >
                  تأیید تحویل
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LedgerTable({
  kind,
  scopeSet,
}: {
  kind: "consumption" | "movements" | "receipts";
  scopeSet: Record<string, unknown>;
}) {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: unknown;
      if (kind === "consumption") {
        data = unwrapApiResponse(await getConsumptionRows({ set: { limit: 200, ...scopeSet } }));
      } else if (kind === "movements") {
        data = unwrapApiResponse(await getStockMovementRows({ set: { limit: 200, ...scopeSet } }));
      } else {
        data = unwrapApiResponse(await getGoodsReceiptRows({ set: { limit: 200, ...scopeSet } }));
      }
      setRows(Array.isArray(data) ? (data as Array<Record<string, unknown>>) : []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [kind, scopeSet]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PageSkeleton blocks={[180]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;
  if (rows.length === 0) return <EmptyState message="رکوردی ثبت نشده است." />;

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const id = String((row as { _id?: string })._id || "");
        // `goods_receipt` has no `ware` relation — the ware identity lives in the
        // embedded items[] array, so fall back to the first named item.
        const items = (row as { items?: Array<{ ware_name?: string }> }).items;
        const ware =
          (row as { ware?: Ref }).ware?.name ??
          items?.find((item) => item.ware_name)?.ware_name;
        const unit =
          (row as { unit?: Ref }).unit?.name ??
          (row as { receiving_unit?: Ref }).receiving_unit?.name;
        // Receipts record `received_by`, not `created_by`.
        const who =
          (row as { consumed_by?: UserRef }).consumed_by ??
          (row as { created_by?: UserRef }).created_by ??
          (row as { received_by?: UserRef }).received_by;
        const quantity = (row as { quantity?: number }).quantity;
        const reason = (row as { reason?: string }).reason;
        const status = (row as { status?: string }).status;
        const receiptNo = (row as { receipt_number?: string }).receipt_number;
        const date =
          (row as { consumed_at?: string }).consumed_at ??
          (row as { createdAt?: string }).createdAt ??
          (row as { received_at?: string }).received_at;

        return (
          <div
            key={id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-white">{ware || "کالا"}</span>
              {quantity !== undefined && (
                <span className="font-mono text-xs text-slate-400">
                  {Number(quantity).toLocaleString("fa-IR")}
                </span>
              )}
              {receiptNo && (
                <span className="font-mono text-xs text-slate-400" dir="ltr">
                  {receiptNo}
                </span>
              )}
              {unit && <span className="text-xs text-slate-500">{unit}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              {reason && <span>{reason}</span>}
              {status && <StatusPill status={status} />}
              {who?.first_name && (
                <span>
                  {who.first_name} {who.last_name || ""}
                </span>
              )}
              {date && <span>{new Date(date).toLocaleDateString("fa-IR")}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status?: string }) {
  const positive = ["active", "approved", "issued", "completed", "received"].includes(
    status || "",
  );
  const pending = ["pending", "draft"].includes(status || "");
  const tone = positive
    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
    : pending
      ? "border-amber-400/25 bg-amber-400/10 text-amber-200"
      : status === "rejected"
        ? "border-rose-400/25 bg-rose-400/10 text-rose-200"
        : "border-white/10 bg-white/[.04] text-slate-300";

  const labels: Record<string, string> = {
    pending: "در انتظار تأیید",
    approved: "تأییدشده",
    issued: "صادرشده",
    received: "تحویل‌شده",
    rejected: "ردشده",
    completed: "تکمیل‌شده",
    draft: "پیش‌نویس",
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${tone}`}>
      {labels[status || ""] || status || "—"}
    </span>
  );
}
