"use client";

import { useCallback, useEffect, useState } from "react";
import { addPoliceStation } from "@/app/actions/police_station/add";
import { getPoliceStations } from "@/app/actions/police_station/gets";
import { updatePoliceStation } from "@/app/actions/police_station/update";
import { removePoliceStation } from "@/app/actions/police_station/remove";
import { getPatrolErrorMessage, unwrapApiResponse } from "@/utils/api-response";
import { Button } from "@/components/atoms/Button";
import MyInput from "@/components/atoms/MyInput";
import { EmptyState, Notice, PanelCard } from "@/components/patrol/ui";
import { useScrollLock } from "@/hooks/useScrollLock";

export type Station = {
  _id: string;
  name?: string;
  code?: number;
  military_rank?: number;
  is_active?: boolean;
  patrol_units?: { _id: string; name?: string; code?: string }[];
};

const EMPTY_POLYGON = { type: "Polygon" as const, coordinates: [] };
const EMPTY_MULTIPOLYGON = { type: "MultiPolygon" as const, coordinates: [] };

const stationProjection = {
  _id: 1,
  name: 1,
  code: 1,
  military_rank: 1,
  is_active: 1,
  patrol_units: { _id: 1, name: 1, code: 1 },
} as const;

export function StationsPanel({ busy, run }: { busy: boolean; run: (operation: () => Promise<unknown>, successMessage: string) => Promise<void> }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [rank, setRank] = useState("");
  const [editing, setEditing] = useState<Station | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editRank, setEditRank] = useState("");

  useScrollLock(!!editing);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await getPoliceStations({
        set: { page: 1, limit: 100 },
        get: stationProjection as never,
      });
      setStations(unwrapApiResponse<Station[]>(response) || []);
    } catch (cause) {
      setLoadError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !code.trim()) return;
    await run(
      () =>
        addPoliceStation({
          set: {
            name: name.trim(),
            code: Number(code.trim()),
            military_rank: Number(rank.trim() || 0),
            location: EMPTY_POLYGON,
            area: EMPTY_MULTIPOLYGON,
            is_active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          get: stationProjection as never,
        }),
      "کلانتری ایجاد شد.",
    );
    setName("");
    setCode("");
    setRank("");
    await load();
  };

  const openEdit = (station: Station) => {
    setEditing(station);
    setEditName(station.name || "");
    setEditCode(station.code ? String(station.code) : "");
    setEditRank(station.military_rank ? String(station.military_rank) : "");
  };

  const saveEdit = async () => {
    if (!editing || !editName.trim() || !editCode.trim()) return;
    await run(
      () =>
        updatePoliceStation({
          set: {
            _id: editing._id,
            name: editName.trim(),
            code: Number(editCode.trim()),
            military_rank: Number(editRank.trim() || 0),
          },
          get: stationProjection as never,
        }),
      "اطلاعات کلانتری به‌روزرسانی شد.",
    );
    setEditing(null);
    await load();
  };

  return (
    <PanelCard title="کلانتری‌ها">
      <form onSubmit={submit} className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <MyInput variant="dark" name="station-name" placeholder="نام کلانتری" value={name} onValueChange={setName} />
        <MyInput variant="dark" name="station-code" placeholder="کد کلانتری (عدد)" value={code} onValueChange={setCode} />
        <MyInput variant="dark" name="station-rank" placeholder="رتبه نظامی (اختیاری)" value={rank} onValueChange={setRank} />
        <Button type="submit" disabled={busy || !name.trim() || !code.trim()} loading={busy}>
          ایجاد کلانتری
        </Button>
      </form>

      {loadError && <Notice tone="rose">{loadError}</Notice>}

      {!loading && !loadError && (
        <div className="grid gap-3 md:grid-cols-2">
          {stations.length ? (
            stations.map((station) => (
              <div key={station._id} className="rounded-xl border border-white/5 bg-white/[.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{station.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      کد {station.code?.toLocaleString("fa-IR")}
                      {station.military_rank ? ` · رتبه ${station.military_rank.toLocaleString("fa-IR")}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] ${station.is_active ? "bg-emerald-400/10 text-emerald-200" : "bg-slate-700 text-slate-400"}`}>
                    {station.is_active ? "فعال" : "غیرفعال"}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  واحدهای تحت پوشش: {station.patrol_units?.length ? station.patrol_units.length.toLocaleString("fa-IR") : "۰"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => openEdit(station)}>
                    ویرایش
                  </Button>
                  <Button
                    size="sm"
                    variant="warning"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () =>
                          updatePoliceStation({
                            set: { _id: station._id, is_active: !station.is_active },
                            get: stationProjection as never,
                          }),
                        "وضعیت کلانتری تغییر کرد.",
                      ).then(load)
                    }
                  >
                    تغییر وضعیت
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("آیا از حذف کلانتری مطمئن هستید؟")) {
                        void run(() => removePoliceStation({ set: { _id: station._id }, get: { success: 1 } }), "کلانتری حذف شد.").then(load);
                      }
                    }}
                  >
                    حذف
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState message="هنوز کلانتری‌ای ثبت نشده است." />
          )}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">ویرایش کلانتری</h3>
            <div className="mt-4 space-y-3">
              <MyInput variant="dark" name="edit-station-name" label="نام" value={editName} onValueChange={setEditName} />
              <MyInput variant="dark" name="edit-station-code" label="کد" value={editCode} onValueChange={setEditCode} />
              <MyInput variant="dark" name="edit-station-rank" label="رتبه نظامی" value={editRank} onValueChange={setEditRank} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="neutral" onClick={() => setEditing(null)}>
                انصراف
              </Button>
              <Button disabled={busy || !editName.trim() || !editCode.trim()} loading={busy} onClick={() => void saveEdit()}>
                ذخیره
              </Button>
            </div>
          </div>
        </div>
      )}
    </PanelCard>
  );
}
