"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ModalShell } from "@/components/org/OrgSelect";
import { Button } from "@/components/atoms/Button";
import { getWareRows } from "@/app/actions/ware/gets";
import { getUnits } from "@/app/actions/unit/getUnits";
import { addConsumption } from "@/app/actions/consumption/add";
import { addGoodsRequest } from "@/app/actions/goods_request/add";
import { addGoodsReceipt } from "@/app/actions/goods_receipt/add";
import { adjustInventoryRow } from "@/app/actions/inventory/adjust";
import { transferInventory } from "@/app/actions/inventory/transfer";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";

/**
 * Forms for the warehouse surface.
 *
 * One form per backend act, kept free of panel concerns so the OrgHead,
 * UnitHead and Employee panels can each mount the subset their role allows.
 */

const INPUT_CLASS =
  "w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/20";
const LABEL_CLASS = "mb-1.5 block text-xs text-slate-400";

export interface WareOption {
  _id: string;
  name?: string;
  enName?: string;
}

export interface UnitOption {
  _id: string;
  name?: string;
  type?: string;
}

/** Loads the ware catalogue once per mount — used by every form below. */
export function useWareOptions() {
  const [wares, setWares] = useState<WareOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = unwrapApiResponse<WareOption[]>(
          await getWareRows({ get: { _id: 1, name: 1, enName: 1 } }),
        );
        if (alive) setWares(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setWares([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { wares, loading };
}

function useUnitOptions(orgId?: string) {
  const [units, setUnits] = useState<UnitOption[]>([]);

  useEffect(() => {
    if (!orgId) {
      setUnits([]);
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const data = unwrapApiResponse<UnitOption[]>(
          await getUnits({ set: { organizationId: orgId, limit: 200 } }),
        );
        if (alive) setUnits(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setUnits([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orgId]);

  return units;
}

function WareSelect({
  wares,
  value,
  onChange,
  label = "کالا",
}: {
  wares: WareOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <select className={INPUT_CLASS} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">انتخاب کالا…</option>
        {wares.map((ware) => (
          <option key={ware._id} value={ware._id}>
            {ware.name || ware.enName || ware._id}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Submits an act, toasts the outcome and closes on success. */
function useSubmitter(onDone: () => void) {
  const [busy, setBusy] = useState(false);

  const submit = useCallback(
    async (
      run: () => Promise<{ success: boolean; body?: unknown }>,
      successMessage: string,
    ) => {
      setBusy(true);
      try {
        const response = await run();
        if (response.success) {
          toast.success(successMessage);
          onDone();
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
    },
    [onDone],
  );

  return { busy, submit };
}

export function ConsumptionForm({
  unitId,
  onClose,
  onSaved,
}: {
  unitId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { wares } = useWareOptions();
  const [wareId, setWareId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const { busy, submit } = useSubmitter(onSaved);

  const valid = Boolean(wareId && Number(quantity) > 0);

  return (
    <ModalShell title="ثبت مصرف" onClose={onClose}>
      <div className="space-y-4">
        <WareSelect wares={wares} value={wareId} onChange={setWareId} />
        <div>
          <label className={LABEL_CLASS}>مقدار</label>
          <input
            className={INPUT_CLASS}
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="مثلاً ۲"
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>علت مصرف</label>
          <input
            className={INPUT_CLASS}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثلاً تعمیر خودرو"
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>توضیحات</label>
          <textarea
            className={`${INPUT_CLASS} min-h-20`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="neutral" onClick={onClose}>
            انصراف
          </Button>
          <Button
            loading={busy}
            disabled={!valid || busy}
            onClick={() =>
              void submit(
                () =>
                  addConsumption({
                    set: {
                      unitId,
                      wareId,
                      quantity: Number(quantity),
                      ...(reason ? { reason } : {}),
                      ...(notes ? { notes } : {}),
                    },
                  }),
                "مصرف ثبت شد.",
              )
            }
          >
            ثبت مصرف
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

export function GoodsRequestForm({
  unitId,
  onClose,
  onSaved,
}: {
  unitId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { wares } = useWareOptions();
  const [wareId, setWareId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [priority, setPriority] = useState(false);
  const [notes, setNotes] = useState("");
  const { busy, submit } = useSubmitter(onSaved);

  const valid = Boolean(wareId && Number(quantity) > 0);

  return (
    <ModalShell title="درخواست کالا" onClose={onClose}>
      <div className="space-y-4">
        <WareSelect wares={wares} value={wareId} onChange={setWareId} />
        <div>
          <label className={LABEL_CLASS}>مقدار درخواستی</label>
          <input
            className={INPUT_CLASS}
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="مثلاً ۵"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={priority}
            onChange={(e) => setPriority(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-slate-950"
          />
          درخواست فوری
        </label>
        <div>
          <label className={LABEL_CLASS}>توضیحات</label>
          <textarea
            className={`${INPUT_CLASS} min-h-20`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="neutral" onClick={onClose}>
            انصراف
          </Button>
          <Button
            loading={busy}
            disabled={!valid || busy}
            onClick={() =>
              void submit(
                () =>
                  addGoodsRequest({
                    set: {
                      unitId,
                      wareId,
                      quantity: Number(quantity),
                      ...(priority ? { priority: true } : {}),
                      ...(notes ? { notes } : {}),
                    },
                  }),
                "درخواست ثبت شد.",
              )
            }
          >
            ثبت درخواست
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

export function GoodsReceiptForm({
  receivingUnitId,
  onClose,
  onSaved,
}: {
  receivingUnitId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { wares } = useWareOptions();
  const [lines, setLines] = useState<
    Array<{ wareId: string; received: string; rejected: string }>
  >([{ wareId: "", received: "", rejected: "" }]);
  const [notes, setNotes] = useState("");
  const { busy, submit } = useSubmitter(onSaved);

  const acceptedOf = (line: { received: string; rejected: string }) =>
    Math.max(Number(line.received || 0) - Number(line.rejected || 0), 0);

  const valid = lines.some(
    (line) => line.wareId && Number(line.received) > 0 && acceptedOf(line) >= 0,
  );

  const updateLine = (
    index: number,
    patch: Partial<{ wareId: string; received: string; rejected: string }>,
  ) => {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  };

  return (
    <ModalShell title="ثبت رسید کالا" onClose={onClose}>
      <div className="space-y-4">
        {lines.map((line, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              <WareSelect
                wares={wares}
                value={line.wareId}
                onChange={(value) => updateLine(index, { wareId: value })}
                label={index === 0 ? "کالا" : ""}
              />
            </div>
            <div className="w-24">
              <label className={LABEL_CLASS}>{index === 0 ? "دریافتی" : ""}</label>
              <input
                className={INPUT_CLASS}
                inputMode="numeric"
                value={line.received}
                onChange={(e) => updateLine(index, { received: e.target.value })}
              />
            </div>
            <div className="w-20">
              <label className={LABEL_CLASS}>{index === 0 ? "مردود" : ""}</label>
              <input
                className={INPUT_CLASS}
                inputMode="numeric"
                value={line.rejected}
                onChange={(e) => updateLine(index, { rejected: e.target.value })}
                placeholder="۰"
              />
            </div>
            {lines.length > 1 && (
              <button
                type="button"
                onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                className="mb-1 rounded-xl border border-rose-400/20 px-3 py-2.5 text-xs text-rose-200 transition hover:bg-rose-400/10"
              >
                حذف
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            setLines((current) => [
              ...current,
              { wareId: "", received: "", rejected: "" },
            ])
          }
          className="text-xs text-blue-300 transition hover:text-blue-200"
        >
          + افزودن قلم
        </button>

        <div>
          <label className={LABEL_CLASS}>توضیحات</label>
          <textarea
            className={`${INPUT_CLASS} min-h-20`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="neutral" onClick={onClose}>
            انصراف
          </Button>
          <Button
            loading={busy}
            disabled={!valid || busy}
            onClick={() =>
              void submit(
                () =>
                  addGoodsReceipt({
                    set: {
                      receivingUnitId,
                      items: lines
                        .filter((line) => line.wareId && Number(line.received) > 0)
                        .map((line) => {
                          const received = Number(line.received);
                          const rejected = Number(line.rejected || 0);
                          return {
                            ware_id: line.wareId,
                            ware_name:
                              wares.find((ware) => ware._id === line.wareId)?.name ||
                              undefined,
                            quantity_received: received,
                            quantity_rejected: rejected,
                            quantity_accepted: Math.max(received - rejected, 0),
                          };
                        }),
                      ...(notes ? { notes } : {}),
                    },
                  }),
                "رسید کالا ثبت و به موجودی اضافه شد.",
              )
            }
          >
            ثبت رسید
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

export function TransferForm({
  orgId,
  defaultFromUnitId,
  onClose,
  onSaved,
}: {
  orgId: string;
  defaultFromUnitId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { wares } = useWareOptions();
  const units = useUnitOptions(orgId);
  const [fromUnitId, setFromUnitId] = useState(defaultFromUnitId || "");
  const [toUnitId, setToUnitId] = useState("");
  const [wareId, setWareId] = useState("");
  const [quantity, setQuantity] = useState("");
  const { busy, submit } = useSubmitter(onSaved);

  const valid =
    Boolean(fromUnitId && toUnitId && wareId && Number(quantity) > 0) &&
    fromUnitId !== toUnitId;

  return (
    <ModalShell title="انتقال کالا بین واحدها" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>از واحد</label>
          <select
            className={INPUT_CLASS}
            value={fromUnitId}
            onChange={(e) => setFromUnitId(e.target.value)}
          >
            <option value="">انتخاب واحد مبدأ…</option>
            {units.map((unit) => (
              <option key={unit._id} value={unit._id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>به واحد</label>
          <select
            className={INPUT_CLASS}
            value={toUnitId}
            onChange={(e) => setToUnitId(e.target.value)}
          >
            <option value="">انتخاب واحد مقصد…</option>
            {units.map((unit) => (
              <option key={unit._id} value={unit._id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>
        <WareSelect wares={wares} value={wareId} onChange={setWareId} />
        <div>
          <label className={LABEL_CLASS}>مقدار</label>
          <input
            className={INPUT_CLASS}
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        {fromUnitId && toUnitId && fromUnitId === toUnitId && (
          <p className="text-xs text-rose-300">واحد مبدأ و مقصد نباید یکسان باشند.</p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="neutral" onClick={onClose}>
            انصراف
          </Button>
          <Button
            loading={busy}
            disabled={!valid || busy}
            onClick={() =>
              void submit(
                () =>
                  transferInventory({
                    set: {
                      fromUnitId,
                      toUnitId,
                      wareId,
                      quantity: Number(quantity),
                    },
                  }),
                "انتقال انجام شد.",
              )
            }
          >
            انتقال
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

export function AdjustStockForm({
  unitId,
  wareId,
  wareName,
  currentQuantity,
  onClose,
  onSaved,
}: {
  unitId: string;
  wareId: string;
  wareName: string;
  currentQuantity: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [quantity, setQuantity] = useState(String(currentQuantity));
  const [reason, setReason] = useState("");
  const { busy, submit } = useSubmitter(onSaved);

  return (
    <ModalShell title={`اصلاح موجودی — ${wareName}`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          موجودی فعلی: {currentQuantity.toLocaleString("fa-IR")}
        </p>
        <div>
          <label className={LABEL_CLASS}>موجودی شمارش‌شده</label>
          <input
            className={INPUT_CLASS}
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>علت اصلاح</label>
          <input
            className={INPUT_CLASS}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثلاً مغایرت انبارگردانی"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="neutral" onClick={onClose}>
            انصراف
          </Button>
          <Button
            loading={busy}
            disabled={busy || quantity === ""}
            onClick={() =>
              void submit(
                () =>
                  adjustInventoryRow({
                    set: {
                      unitId,
                      wareId,
                      quantity: Number(quantity),
                      ...(reason ? { reason } : {}),
                    },
                  }),
                "موجودی اصلاح شد.",
              )
            }
          >
            ثبت اصلاح
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
