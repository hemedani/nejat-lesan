"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getOperationsSummary } from "@/app/actions/patrol_operations/getOperationsSummary";
import { addPatrolUnit } from "@/app/actions/patrol_unit/add";
import { getPatrolUnits } from "@/app/actions/patrol_unit/gets";
import { removePatrolUnit } from "@/app/actions/patrol_unit/remove";
import { updatePatrolUnitRelations } from "@/app/actions/patrol_unit/updateRelations";
import { getPatrolShifts } from "@/app/actions/shift/getShifts";
import { endPatrolShift } from "@/app/actions/shift/endShift";
import { assignPatrolShift } from "@/app/actions/shift/assignShift";
import { getPatrolOfficers } from "@/app/actions/user/getPatrolOfficers";
import { getPoliceStations } from "@/app/actions/police_station/gets";
import { getEmergencies } from "@/app/actions/emergency/gets";
import { addVehicle } from "@/app/actions/vehicle/add";
import { getVehicles } from "@/app/actions/vehicle/gets";
import { updateVehicle } from "@/app/actions/vehicle/update";
import { removeVehicle } from "@/app/actions/vehicle/remove";
import { getPatrolErrorMessage, unwrapApiResponse } from "@/utils/api-response";
import { ToastNotify } from "@/utils/helper";
import { Button } from "@/components/atoms/Button";
import MyInput from "@/components/atoms/MyInput";
import SelectBox from "@/components/atoms/Select";
import { EmptyState, PageSkeleton, PanelCard } from "@/components/patrol/ui";
import { useScrollLock } from "@/hooks/useScrollLock";
import { StationsPanel, type Station } from "@/components/patrol/operations/StationsPanel";
import { OfficerDevices } from "@/components/patrol/operations/OfficerDevices";
import { AnnouncementsPanel } from "@/components/patrol/operations/AnnouncementsPanel";
import { EmergenciesPanel } from "@/components/patrol/operations/EmergenciesPanel";
import { SyncStatusWidget } from "@/components/patrol/operations/SyncStatusWidget";

type Tab =
  | "overview"
  | "officers"
  | "units"
  | "vehicles"
  | "shifts"
  | "stations"
  | "announcements"
  | "emergencies";

type Ref = { _id: string; name?: string; code?: string; title?: string; is_active?: boolean };

type Officer = Ref & {
  first_name?: string;
  last_name?: string;
  personnel_code?: string;
  email?: string;
  patrol_unit?: Ref;
  active_shift?: Shift | null;
};

type Unit = Ref & {
  officers?: Officer[];
  vehicles?: Ref[];
  police_station?: Ref;
  active_shift_count?: number;
};

type Vehicle = Ref & {
  plaque_no?: string[];
  patrol_unit?: Ref;
  active_shift_count?: number;
};

type Shift = {
  _id: string;
  shift_type?: string;
  status?: string;
  start_at?: string;
  end_at?: string;
  note?: string;
  officer?: Officer;
  patrol_unit?: Ref;
  vehicle?: Vehicle;
};

type Summary = {
  patrolUsers: { total: number; active: number };
  patrolUnits: { total: number; active: number };
  vehicles: { total: number; active: number; assigned: number };
  shifts: { active: number; endedToday: number };
};

const relationProjection = { _id: 1, code: 1, name: 1, is_active: 1 } as const;

// `active_shift` و `active_shift_count` فیلدهای محاسبه‌شده هستند و به‌صورت خودکار
// در پاسخ برگردانده می‌شوند؛ انتخاب آن‌ها در get توسط اعتبارسنج بک‌اند رد می‌شود.
const officerProjection = {
  _id: 1,
  first_name: 1,
  last_name: 1,
  personnel_code: 1,
  email: 1,
  level: 1,
  is_active: 1,
  patrol_unit: relationProjection,
} as const;

const vehicleRelationProjection = { _id: 1, title: 1, plaque_no: 1, is_active: 1 } as const;

const officerLabel = (officer?: Officer) =>
  [officer?.first_name, officer?.last_name].filter(Boolean).join(" ") || "نامشخص";

const vehiclePlate = (vehicle?: Vehicle) =>
  Array.isArray(vehicle?.plaque_no) ? vehicle.plaque_no.join(" ") : vehicle?.plaque_no || "بدون پلاک";

export function PatrolOperations() {
  const [tab, setTab] = useState<Tab>("overview");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [unitName, setUnitName] = useState("");
  const [vehicleTitle, setVehicleTitle] = useState("");
  const [vehiclePlaque, setVehiclePlaque] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [activeSosCount, setActiveSosCount] = useState(0);

  useScrollLock(!!selectedUnit);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [summaryResponse, officersResponse, unitsResponse, vehiclesResponse, shiftsResponse, stationsResponse, activeSosResponse] =
        await Promise.all([
          getOperationsSummary({
            set: {},
            get: {
              patrolUsers: { total: 1, active: 1 },
              patrolUnits: { total: 1, active: 1 },
              vehicles: { total: 1, active: 1, assigned: 1 },
              shifts: { active: 1, endedToday: 1 },
            },
          }),
          getPatrolOfficers({
            set: { page: 1, limit: 100, ...(search.trim() ? { search: search.trim() } : {}) },
            get: officerProjection as never,
          }),
          getPatrolUnits({
            set: { page: 1, limit: 100 },
            get: {
              _id: 1,
              code: 1,
              name: 1,
              is_active: 1,
              police_station: relationProjection,
              officers: officerProjection,
              vehicles: vehicleRelationProjection,
            } as never,
          }),
          getVehicles({
            set: { page: 1, limit: 100 },
            get: {
              _id: 1,
              plaque_no: 1,
              title: 1,
              is_active: 1,
              patrol_unit: relationProjection,
            } as never,
          }),
          getPatrolShifts({
            set: { page: 1, limit: 100 },
            get: {
              _id: 1,
              shift_type: 1,
              status: 1,
              start_at: 1,
              end_at: 1,
              note: 1,
              officer: officerProjection,
              patrol_unit: relationProjection,
              vehicle: { _id: 1, plaque_no: 1, title: 1 },
            } as never,
          }),
          getPoliceStations({
            set: { page: 1, limit: 100 },
            get: { _id: 1, name: 1, code: 1, military_rank: 1, is_active: 1 } as never,
          }),
          getEmergencies({ set: { page: 1, limit: 100, status: "active" }, get: { _id: 1 } as never }),
        ]);
      setSummary(unwrapApiResponse<Summary>(summaryResponse));
      setOfficers(unwrapApiResponse<Officer[]>(officersResponse) || []);
      setUnits(unwrapApiResponse<Unit[]>(unitsResponse) || []);
      setVehicles(unwrapApiResponse<Vehicle[]>(vehiclesResponse) || []);
      setShifts(unwrapApiResponse<Shift[]>(shiftsResponse) || []);
      setStations(unwrapApiResponse<Station[]>(stationsResponse) || []);
      setActiveSosCount((unwrapApiResponse<unknown[]>(activeSosResponse) || []).length);
    } catch (cause) {
      setLoadError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (operation: () => Promise<unknown>, successMessage: string) => {
    setBusy(true);
    try {
      unwrapApiResponse(await operation());
      setSelectedUnit(null);
      setSelectedOfficer("");
      setSelectedVehicle("");
      await load();
      ToastNotify("success", successMessage);
    } catch (cause) {
      ToastNotify("error", getPatrolErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const handleActiveSosCount = useCallback((count: number) => setActiveSosCount(count), []);
  const handleSosChanged = useCallback(() => void load(), [load]);

  const createUnit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!unitCode.trim() || !unitName.trim()) return;
    await run(
      () =>
        addPatrolUnit({
          set: {
            code: unitCode.trim(),
            name: unitName.trim(),
            is_active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          get: { _id: 1, code: 1, name: 1, is_active: 1 },
        }),
      "واحد گشت ایجاد شد.",
    );
    setUnitCode("");
    setUnitName("");
  };

  const createVehicle = async (event: React.FormEvent) => {
    event.preventDefault();
    const plaqueParts = vehiclePlaque.split("/").map((part) => part.trim()).filter(Boolean);
    if (!vehicleTitle.trim() || plaqueParts.length !== 3) return;
    await run(
      () =>
        addVehicle({
          set: {
            plaque_no: plaqueParts,
            title: vehicleTitle.trim(),
            is_active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          get: { _id: 1, plaque_no: 1, title: 1, is_active: 1 },
        }),
      "خودرو ایجاد شد.",
    );
    setVehicleTitle("");
    setVehiclePlaque("");
  };

  const tabs: Array<[Tab, string]> = [
    ["overview", "نمای کلی"],
    ["officers", "مأموران"],
    ["units", "واحدها"],
    ["vehicles", "خودروها"],
    ["shifts", "شیفت‌ها"],
    ["stations", "کلانتری‌ها"],
    ["announcements", "اطلاعیه‌ها"],
    ["emergencies", "وضعیت اضطراری"],
  ];

  if (loading) return <PageSkeleton blocks={[96, 120, 320]} />;
  if (loadError) return <NoticeBox>{loadError}</NoticeBox>;

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5 shadow-xl">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs text-blue-200">مرکز مدیریت موبایل گشت</p>
            <h1 className="mt-1 text-2xl font-bold text-white">مدیریت عملیات گشت</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              اطلاعات عملیاتی مورد استفاده اپلیکیشن موبایل را از یک مرکز واحد مدیریت کنید.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/patrol-manager/operations/create-officer"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,.18)] transition-colors hover:bg-blue-500"
            >
              ایجاد مأمور
            </Link>
            <Link
              href="/admin/accident/create"
              className="rounded-xl border border-white/15 bg-white/[.06] px-4 py-2.5 text-sm text-slate-200 transition-colors hover:bg-white/10"
            >
              ثبت گزارش
            </Link>
          </div>
        </div>
      </header>

      {activeSosCount > 0 && (
        <button
          type="button"
          onClick={() => setTab("emergencies")}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-rose-400/40 bg-rose-500/15 px-5 py-4 text-right shadow-[0_0_30px_rgba(244,63,94,.25)] transition-colors hover:bg-rose-500/20"
        >
          <span className="flex items-center gap-3">
            <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-rose-400" />
            <span>
              <span className="block font-bold text-rose-100">
                {activeSosCount.toLocaleString("fa-IR")} درخواست اضطراری فعال
              </span>
              <span className="mt-0.5 block text-xs text-rose-200/80">
                مأموران گشت نیازمند بررسی فوری هستند.
              </span>
            </span>
          </span>
          <span className="shrink-0 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white">
            رسیدگی فوری
          </span>
        </button>
      )}

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/75 p-2 shadow-xl">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm transition ${
              tab === key
                ? "bg-blue-600 font-semibold text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {(tab === "overview" || tab === "officers") && summary && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="مأموران گشت" value={summary.patrolUsers.total} detail={`${summary.patrolUsers.active.toLocaleString("fa-IR")} فعال`} />
          <Metric label="واحدهای گشت" value={summary.patrolUnits.total} detail={`${summary.patrolUnits.active.toLocaleString("fa-IR")} فعال`} />
          <Metric label="خودروها" value={summary.vehicles.total} detail={`${summary.vehicles.assigned.toLocaleString("fa-IR")} تخصیص‌یافته`} />
          <Metric label="شیفت‌های فعال" value={summary.shifts.active} detail={`${summary.shifts.endedToday.toLocaleString("fa-IR")} پایان‌یافته امروز`} />
          <Metric
            label="اضطراری فعال"
            value={activeSosCount}
            detail={activeSosCount ? "نیازمند رسیدگی فوری" : "وضعیت پایدار"}
          />
        </section>
      )}

      {tab === "overview" && (
        <>
          <Overview officers={officers} units={units} vehicles={vehicles} shifts={shifts} onTab={setTab} />
          <PanelCard title="وضعیت همگام‌سازی گزارش‌ها">
            <p className="mb-3 text-xs text-slate-500">
              توزیع گزارش‌های ثبت‌شده توسط اپلیکیشن موبایل بر اساس وضعیت همگام‌سازی.
            </p>
            <SyncStatusWidget />
          </PanelCard>
        </>
      )}

      {tab === "officers" && (
        <Officers officers={officers} search={search} setSearch={setSearch} />
      )}

      {tab === "stations" && <StationsPanel busy={busy} run={run} />}

      {tab === "announcements" && <AnnouncementsPanel units={units} />}

      {tab === "emergencies" && (
        <EmergenciesPanel onActiveCountChange={handleActiveSosCount} onChanged={handleSosChanged} />
      )}

      {tab === "units" && (
        <Units
          units={units}
          unitCode={unitCode}
          unitName={unitName}
          setUnitCode={setUnitCode}
          setUnitName={setUnitName}
          createUnit={createUnit}
          busy={busy}
          onSelect={setSelectedUnit}
          onRemove={(id) => {
            if (window.confirm("آیا از حذف واحد گشت مطمئن هستید؟")) {
              void run(() => removePatrolUnit({ set: { _id: id }, get: { success: 1 } }), "واحد گشت حذف شد.");
            }
          }}
        />
      )}

      {tab === "vehicles" && (
        <Vehicles
          vehicles={vehicles}
          title={vehicleTitle}
          plaque={vehiclePlaque}
          setTitle={setVehicleTitle}
          setPlaque={setVehiclePlaque}
          onCreate={createVehicle}
          busy={busy}
          onToggle={(vehicle) =>
            void run(
              () =>
                updateVehicle({ set: { _id: vehicle._id, is_active: !vehicle.is_active }, get: { _id: 1, is_active: 1 } }),
              "وضعیت خودرو تغییر کرد.",
            )
          }
          onRemove={(id) => {
            if (window.confirm("آیا از حذف خودرو مطمئن هستید؟")) {
              void run(() => removeVehicle({ set: { _id: id }, get: { success: 1 } }), "خودرو حذف شد.");
            }
          }}
        />
      )}

      {tab === "shifts" && (
        <Shifts
          shifts={shifts}
          onEnd={(id) => void run(() => endPatrolShift({ set: { shiftId: id }, get: { _id: 1, status: 1, end_at: 1 } }), "شیفت پایان یافت.")}
        />
      )}

      {selectedUnit && (
        <UnitRelations
          unit={selectedUnit}
          officers={officers}
          vehicles={vehicles}
          stations={stations}
          selectedOfficer={selectedOfficer}
          selectedVehicle={selectedVehicle}
          selectedStation={selectedStation}
          setSelectedOfficer={setSelectedOfficer}
          setSelectedVehicle={setSelectedVehicle}
          setSelectedStation={setSelectedStation}
          onClose={() => setSelectedUnit(null)}
          onSave={(set) =>
            void run(
              () =>
                updatePatrolUnitRelations({
                  set,
                  get: {
                    _id: 1,
                    code: 1,
                    name: 1,
                    is_active: 1,
                    police_station: relationProjection,
                    officers: officerProjection,
                    vehicles: vehicleRelationProjection,
                  } as never,
                }),
              "ارتباطات واحد به‌روزرسانی شد.",
            )
          }
        />
      )}
    </div>
  );
}

function Overview({
  officers,
  units,
  vehicles,
  shifts,
  onTab,
}: {
  officers: Officer[];
  units: Unit[];
  vehicles: Vehicle[];
  shifts: Shift[];
  onTab: (tab: Tab) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <PanelCard title="وضعیت مأموران">
        <div className="space-y-2">
          {officers.slice(0, 5).map((officer) => (
            <div key={officer._id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[.03] p-3">
              <span className="text-sm text-slate-200">{officerLabel(officer)}</span>
              <span className="text-xs text-slate-500">{officer.active_shift ? "شیفت فعال" : officer.patrol_unit?.name || "بدون واحد"}</span>
            </div>
          ))}
          <button onClick={() => onTab("officers")} className="text-sm text-blue-300 transition-colors hover:text-cyan-200">
            مشاهده همه مأموران
          </button>
        </div>
      </PanelCard>

      <PanelCard title="شیفت‌های جاری">
        <div className="space-y-2">
          {shifts
            .filter((shift) => shift.status === "active")
            .slice(0, 5)
            .map((shift) => (
              <div key={shift._id} className="flex items-center justify-between rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3">
                <span className="text-sm text-slate-200">{officerLabel(shift.officer)}</span>
                <span className="text-xs text-emerald-200">{shift.patrol_unit?.name || "واحد نامشخص"}</span>
              </div>
            ))}
          <button onClick={() => onTab("shifts")} className="text-sm text-blue-300 transition-colors hover:text-cyan-200">
            مدیریت شیفت‌ها
          </button>
        </div>
      </PanelCard>

      <PanelCard title="واحدهای فعال">
        <div className="space-y-2">
          {units
            .filter((unit) => unit.is_active)
            .slice(0, 5)
            .map((unit) => (
              <div key={unit._id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[.03] p-3">
                <span className="text-sm text-slate-200">{unit.name}</span>
                <span className="text-xs text-slate-500">{unit.active_shift_count || 0} شیفت فعال</span>
              </div>
            ))}
          <button onClick={() => onTab("units")} className="text-sm text-blue-300 transition-colors hover:text-cyan-200">
            مدیریت واحدها
          </button>
        </div>
      </PanelCard>

      <PanelCard title="خودروهای عملیاتی">
        <div className="space-y-2">
          {vehicles.slice(0, 5).map((vehicle) => (
            <div key={vehicle._id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[.03] p-3">
              <span className="text-sm text-slate-200">{vehicle.title}</span>
              <span className="text-xs text-slate-500">{vehiclePlate(vehicle)}</span>
            </div>
          ))}
          <button onClick={() => onTab("vehicles")} className="text-sm text-blue-300 transition-colors hover:text-cyan-200">
            مدیریت خودروها
          </button>
        </div>
      </PanelCard>
    </div>
  );
}

function Officers({
  officers,
  search,
  setSearch,
}: {
  officers: Officer[];
  search: string;
  setSearch: (value: string) => void;
}) {
  return (
    <PanelCard title="مأموران گشت">
      <MyInput
        variant="dark"
        name="officer-search"
        placeholder="جستجوی نام یا کد پرسنلی"
        value={search}
        onValueChange={setSearch}
        className="mb-4"
      />
      <div className="grid gap-3 md:grid-cols-2">
        {officers.length ? (
          officers.map((officer) => (
            <div key={officer._id} className="rounded-xl border border-white/5 bg-white/[.03] p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{officerLabel(officer)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {officer.personnel_code || "بدون کد"} · {officer.email || "بدون ایمیل"}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[11px] ${officer.active_shift ? "bg-emerald-400/10 text-emerald-200" : "bg-slate-700 text-slate-400"}`}>
                  {officer.active_shift ? "شیفت فعال" : "آزاد"}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-400">واحد: {officer.patrol_unit?.name || "تخصیص نیافته"}</p>
              <OfficerDevices officerId={officer._id} />
            </div>
          ))
        ) : (
          <EmptyState message="مأمور گشتی پیدا نشد." />
        )}
      </div>
    </PanelCard>
  );
}

function Units({
  units,
  unitCode,
  unitName,
  setUnitCode,
  setUnitName,
  createUnit,
  busy,
  onSelect,
  onRemove,
}: {
  units: Unit[];
  unitCode: string;
  unitName: string;
  setUnitCode: (value: string) => void;
  setUnitName: (value: string) => void;
  createUnit: (event: React.FormEvent) => void;
  busy: boolean;
  onSelect: (unit: Unit) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <PanelCard title="واحدهای گشت">
      <form onSubmit={createUnit} className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <MyInput variant="dark" name="unit-code" placeholder="کد واحد" value={unitCode} onValueChange={setUnitCode} />
        <MyInput variant="dark" name="unit-name" placeholder="نام واحد" value={unitName} onValueChange={setUnitName} />
        <Button type="submit" disabled={busy || !unitCode.trim() || !unitName.trim()} loading={busy}>
          ایجاد واحد
        </Button>
      </form>
      <div className="grid gap-3 md:grid-cols-2">
        {units.length ? (
          units.map((unit) => (
            <div key={unit._id} className="rounded-xl border border-white/5 bg-white/[.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{unit.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {unit.code} · {unit.is_active ? "فعال" : "غیرفعال"}
                  </p>
                </div>
                <span className="text-xs text-cyan-200">{unit.active_shift_count || 0} شیفت</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => onSelect(unit)}>
                  مدیریت اعضا
                </Button>
                <Button size="sm" variant="danger" disabled={busy} onClick={() => onRemove(unit._id)}>
                  حذف
                </Button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState message="واحدی ثبت نشده است." />
        )}
      </div>
    </PanelCard>
  );
}

function Vehicles({
  vehicles,
  title,
  plaque,
  setTitle,
  setPlaque,
  onCreate,
  busy,
  onToggle,
  onRemove,
}: {
  vehicles: Vehicle[];
  title: string;
  plaque: string;
  setTitle: (value: string) => void;
  setPlaque: (value: string) => void;
  onCreate: (event: React.FormEvent) => void;
  busy: boolean;
  onToggle: (vehicle: Vehicle) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <PanelCard title="خودروهای عملیاتی">
      <form onSubmit={onCreate} className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <MyInput variant="dark" name="vehicle-title" placeholder="عنوان خودرو" value={title} onValueChange={setTitle} />
        <MyInput
          variant="dark"
          name="vehicle-plaque"
          placeholder="سه بخش پلاک با / جدا شود"
          value={plaque}
          onValueChange={setPlaque}
        />
        <Button type="submit" disabled={busy || !title.trim() || plaque.split("/").filter(Boolean).length !== 3} loading={busy}>
          ایجاد خودرو
        </Button>
      </form>
      <div className="grid gap-3 md:grid-cols-2">
        {vehicles.length ? (
          vehicles.map((vehicle) => (
            <div key={vehicle._id} className="rounded-xl border border-white/5 bg-white/[.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{vehicle.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {vehiclePlate(vehicle)} · {vehicle.patrol_unit?.name || "بدون واحد"}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[11px] ${vehicle.is_active ? "bg-emerald-400/10 text-emerald-200" : "bg-slate-700 text-slate-400"}`}>
                  {vehicle.is_active ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{vehicle.active_shift_count || 0} شیفت فعال</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => onToggle(vehicle)}>
                  تغییر وضعیت
                </Button>
                <Button size="sm" variant="danger" disabled={busy} onClick={() => onRemove(vehicle._id)}>
                  حذف
                </Button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState message="خودرویی ثبت نشده است." />
        )}
      </div>
    </PanelCard>
  );
}

function Shifts({
  shifts,
  onEnd,
}: {
  shifts: Shift[];
  onEnd: (id: string) => void;
}) {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [officerId, setOfficerId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [shiftType, setShiftType] = useState("شیفت روز");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getPatrolOfficers({ set: { page: 1, limit: 100, is_active: true }, get: officerProjection as never }),
      getPatrolUnits({ set: { page: 1, limit: 100, is_active: true }, get: { _id: 1, code: 1, name: 1, is_active: 1 } as never }),
      getVehicles({ set: { page: 1, limit: 100, is_active: true }, get: { _id: 1, title: 1, plaque_no: 1, is_active: 1, patrol_unit: relationProjection } as never }),
    ])
      .then(([officerResponse, unitResponse, vehicleResponse]) => {
        setOfficers(unwrapApiResponse<Officer[]>(officerResponse) || []);
        setUnits(unwrapApiResponse<Unit[]>(unitResponse) || []);
        setVehicles(unwrapApiResponse<Vehicle[]>(vehicleResponse) || []);
      })
      .catch((cause) => setFormError(getPatrolErrorMessage(cause)));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!officerId || !unitId || !shiftType.trim()) return;
    setPending(true);
    setFormError(null);
    try {
      unwrapApiResponse(
        await assignPatrolShift({
          set: {
            officerId,
            patrolUnitId: unitId,
            ...(vehicleId ? { vehicleId } : {}),
            shiftType: shiftType.trim(),
          },
          get: {
            _id: 1,
            shift_type: 1,
            status: 1,
            start_at: 1,
            officer: officerProjection,
            patrol_unit: relationProjection,
            vehicle: { _id: 1, title: 1, plaque_no: 1 },
          } as never,
        }),
      );
      window.location.reload();
    } catch (cause) {
      setFormError(getPatrolErrorMessage(cause));
      setPending(false);
    }
  };

  return (
    <PanelCard title="شیفت‌ها">
      <form onSubmit={submit} className="mb-5 grid gap-3 lg:grid-cols-5 lg:items-end">
        <SelectBox
          name="shift-officer"
          placeholder="انتخاب مأمور آزاد"
          value={officerId}
          onValueChange={setOfficerId}
          options={officers
            .filter((item) => !item.active_shift)
            .map((item) => ({ value: item._id, label: `${officerLabel(item)} · ${item.personnel_code || "بدون کد"}` }))}
        />
        <SelectBox
          name="shift-unit"
          placeholder="انتخاب واحد"
          value={unitId}
          onValueChange={setUnitId}
          options={units.map((item) => ({ value: item._id, label: item.name || item.code || item._id }))}
        />
        <SelectBox
          name="shift-vehicle"
          placeholder="خودرو اختیاری"
          value={vehicleId}
          onValueChange={setVehicleId}
          options={vehicles
            .filter((item) => !item.active_shift_count)
            .map((item) => ({ value: item._id, label: `${item.title || "خودرو"} · ${vehiclePlate(item)}` }))}
        />
        <MyInput variant="dark" name="shift-type" placeholder="نوع شیفت" value={shiftType} onValueChange={setShiftType} />
        <Button type="submit" disabled={pending || !officerId || !unitId} loading={pending}>
          اختصاص شیفت
        </Button>
      </form>

      {formError && <NoticeBox>{formError}</NoticeBox>}

      <div className="mb-4 mt-4 flex items-center gap-2">
        <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs text-blue-200">همه وضعیت‌ها</span>
        <span className="text-xs text-slate-500">{shifts.length.toLocaleString("fa-IR")} مورد</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {shifts.length ? (
          shifts.map((shift) => (
            <div key={shift._id} className="rounded-xl border border-white/5 bg-white/[.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{officerLabel(shift.officer)}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {shift.patrol_unit?.name || "بدون واحد"} · {shift.shift_type}
                  </p>
                </div>
                {shift.status === "active" && (
                  <Button size="sm" variant="warning" onClick={() => onEnd(shift._id)}>
                    پایان شیفت
                  </Button>
                )}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                خودرو: {vehiclePlate(shift.vehicle)} · شروع:{" "}
                {shift.start_at ? new Date(shift.start_at).toLocaleString("fa-IR") : "نامشخص"}
              </p>
            </div>
          ))
        ) : (
          <EmptyState message="شیفتی برای نمایش وجود ندارد." />
        )}
      </div>
    </PanelCard>
  );
}

function UnitRelations({
  unit,
  officers,
  vehicles,
  stations,
  selectedOfficer,
  selectedVehicle,
  selectedStation,
  setSelectedOfficer,
  setSelectedVehicle,
  setSelectedStation,
  onClose,
  onSave,
}: {
  unit: Unit;
  officers: Officer[];
  vehicles: Vehicle[];
  stations: Station[];
  selectedOfficer: string;
  selectedVehicle: string;
  selectedStation: string;
  setSelectedOfficer: (value: string) => void;
  setSelectedVehicle: (value: string) => void;
  setSelectedStation: (value: string) => void;
  onClose: () => void;
  onSave: (set: {
    _id: string;
    officerIds?: string[];
    removeOfficerIds?: string[];
    vehicleIds?: string[];
    removeVehicleIds?: string[];
    policeStationId?: string;
  }) => void;
}) {
  const currentOfficerIds = new Set((unit.officers || []).map((item) => item._id));
  const currentVehicleIds = new Set((unit.vehicles || []).map((item) => item._id));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-300">مدیریت اعضا</p>
            <h2 className="mt-1 text-xl font-bold text-white">{unit.name}</h2>
          </div>
          <Button size="sm" variant="neutral" onClick={onClose}>
            بستن
          </Button>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <SelectBox
            label="افزودن مأمور"
            name="relation-officer"
            value={selectedOfficer}
            onValueChange={setSelectedOfficer}
            options={officers
              .filter((item) => !currentOfficerIds.has(item._id))
              .map((item) => ({ value: item._id, label: officerLabel(item) }))}
          />
          <SelectBox
            label="افزودن خودرو"
            name="relation-vehicle"
            value={selectedVehicle}
            onValueChange={setSelectedVehicle}
            options={vehicles
              .filter((item) => !currentVehicleIds.has(item._id))
              .map((item) => ({ value: item._id, label: item.title || item._id }))}
          />
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs text-slate-500">
            کلانتری مسئول: {unit.police_station?.name || "تخصیص نیافته"}
          </p>
          <SelectBox
            label="کلانتری"
            name="relation-station"
            value={selectedStation}
            onValueChange={setSelectedStation}
            options={stations.map((station) => ({
              value: station._id,
              label: `${station.name}${station.code ? ` (کد ${station.code})` : ""}`,
            }))}
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs text-slate-500">مأموران فعلی</p>
            {unit.officers?.length ? (
              unit.officers.map((item) => (
                <p key={item._id} className="mb-1 rounded-lg bg-white/[.04] p-2 text-sm text-slate-300">
                  {officerLabel(item)}
                </p>
              ))
            ) : (
              <p className="text-xs text-slate-600">مأموری تخصیص نیافته است.</p>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs text-slate-500">خودروهای فعلی</p>
            {unit.vehicles?.length ? (
              unit.vehicles.map((item) => (
                <p key={item._id} className="mb-1 rounded-lg bg-white/[.04] p-2 text-sm text-slate-300">
                  {item.title || item.code}
                </p>
              ))
            ) : (
              <p className="text-xs text-slate-600">خودرویی تخصیص نیافته است.</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="neutral" onClick={onClose}>
            انصراف
          </Button>
          <Button
            disabled={!selectedOfficer && !selectedVehicle && !selectedStation}
            onClick={() =>
              onSave({
                _id: unit._id,
                ...(selectedOfficer ? { officerIds: [selectedOfficer] } : {}),
                ...(selectedVehicle ? { vehicleIds: [selectedVehicle] } : {}),
                ...(selectedStation ? { policeStationId: selectedStation } : {}),
              })
            }
          >
            ذخیره ارتباطات
          </Button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value.toLocaleString("fa-IR")}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function NoticeBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm leading-6 text-rose-100">
      {children}
    </div>
  );
}
