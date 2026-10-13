"use client";

import { useEffect, useMemo, useState } from "react";
import { adminRecordRoutes } from "@/utils/admin-record-routes";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { add as addRoad, update as updateRoad } from "@/app/actions/road/add";
import { gets as getProvincesAction } from "@/app/actions/province/gets";
import { gets as getPositionsAction } from "@/app/actions/position/gets";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { RoadDetail } from "@/services/road-projections";
import GeoLineDrawer, { type GeoLineString } from "@/components/maps/GeoLineDrawer";
import { PanelCard, RetryErrorBox } from "@/components/patrol/ui";
import { Button } from "@/components/atoms/Button";
import MyInput from "@/components/atoms/MyInput";
import RefSelect, { type RefOption } from "@/components/atoms/RefSelect";

type ProvinceOption = { _id: string; name: string };
type PositionOption = { _id: string; name: string };

export type RoadFormProps = {
  /** `null` یعنی ساختِ تازه. */
  road: RoadDetail | null;
};

/** ایران — قابِ پیش‌فرض نقشه پیش از اینکه هندسه‌ای انتخاب شود. */
const FALLBACK_CENTER = { lat: 32.4279, lng: 53.688 };

const toOption = (o: { _id: string; name: string }): RefOption => ({
  value: o._id,
  label: o.name,
});

/**
 * فرم جاده — مشترک بین «ساخت» و «ویرایش».
 *
 * سه چیز که این فرم را از بقیه متمایز می‌کند:
 *
 * 1. **`total_length_meters` ورودی نیست.** بک‌اند آن را از `area` حساب
 *    می‌کند (`road.add`/`update` اصلاً آن را در validator نمی‌پذیرند)، پس اینجا
 *    فقط نمایش داده می‌شود. تایپ دستی‌اش یا رد می‌شود یا با `area` اختلاف
 *    می‌گیرد و آن اختلاف بی‌صدا به گزارش کیلومتر/متر می‌رسد.
 *
 * 2. **`lanes` به‌صورت `{_id, name}` فرستاده می‌شود**، نه `string[]`. اگر فقط
 *    شناسه بفرود، `common_relation_struct` ردش می‌کند چون `name` اجباری است.
 *
 * 3. **پاک‌کردن `area`/`lanes` کلید را حذف نمی‌کند.** روی update اختیاری‌اند،
 *    پس نبودِ کلید یعنی «نگه دار»؛ برای پاک‌کردن باید مقدار خالی فرستاد.
 */
export function RoadForm({ road }: RoadFormProps) {
  const router = useRouter();
  const isEdit = Boolean(road?._id);

  const [name, setName] = useState(road?.name ?? "");
  const [origin, setOrigin] = useState(road?.origin ?? "");
  const [destination, setDestination] = useState(road?.destination ?? "");
  const [province, setProvince] = useState<RefOption | null>(
    road?.province?._id && road.province.name
      ? { value: road.province._id, label: road.province.name }
      : null,
  );
  const [area, setArea] = useState<GeoLineString | null>(
    (road?.area as GeoLineString) ?? null,
  );
  const [lanes, setLanes] = useState<RefOption[]>(
    (road?.lanes ?? []).map((lane) => ({ value: lane._id, label: lane.name })),
  );

  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, pos] = await Promise.all([
          getProvincesAction({ set: { page: 1, limit: 200 }, get: { _id: 1, name: 1 } }),
          getPositionsAction({ set: { page: 1, limit: 200 }, get: { _id: 1, name: 1 } }),
        ]);
        if (cancelled) return;
        setProvinces(unwrapApiResponse<ProvinceOption[]>(p) ?? []);
        setPositions(unwrapApiResponse<PositionOption[]>(pos) ?? []);
      } catch (cause) {
        if (!cancelled) setLoadError(getPatrolErrorMessage(cause));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const provinceOptions = useMemo(() => provinces.map(toOption), [provinces]);
  const positionOptions = useMemo(() => positions.map(toOption), [positions]);

  // `RefSelect` فقط شناسه می‌دهد؛ `lanes` به `name` هم نیاز دارد، پس از
  // فهرستِ موقعیت‌ها برمی‌گردانیم. اگر شناسه‌ای در فهرست نبود (پاک شده)،
  // فرم آن را رد می‌کند به‌جای اینکه بی‌سروصدا `name` خالی بفرستد.
  const lanesPayload = useMemo(
    () =>
      lanes
        .map((lane) => positions.find((p) => p._id === lane.value))
        .filter((p): p is PositionOption => Boolean(p))
        .map((p) => ({ _id: p._id, name: p.name })),
    [lanes, positions],
  );

  const [nameError, setNameError] = useState<string | undefined>();
  const [provinceError, setProvinceError] = useState<string | undefined>();
  const [areaError, setAreaError] = useState<string | undefined>();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setNameError(undefined);
    setProvinceError(undefined);
    setAreaError(undefined);

    if (!name.trim()) {
      setNameError("نام جاده الزامی است.");
      return;
    }
    if (!province) {
      setProvinceError("انتخاب استان الزامی است.");
      return;
    }
    if (!area) {
      setAreaError("هندسهٔ جاده الزامی است — محور را روی نقشه رسم کنید.");
      return;
    }

    setSaving(true);
    try {
      const response = isEdit
        ? await updateRoad({
            set: {
              _id: road!._id,
              name: name.trim(),
              origin: origin.trim(),
              destination: destination.trim(),
              area,
              lanes: lanesPayload,
              provinceId: province.value,
            },
          })
        : await addRoad({
            set: {
              name: name.trim(),
              origin: origin.trim() || undefined,
              destination: destination.trim() || undefined,
              area,
              lanes: lanesPayload.length ? lanesPayload : undefined,
              provinceId: province.value,
            },
          });

      if (!response.success) {
        toast.error(getPatrolErrorMessage(new Error(response.body?.message ?? "")));
        return;
      }

      toast.success(isEdit ? "جاده به‌روزرسانی شد." : "جاده ایجاد شد.");
      router.push(adminRecordRoutes.roads());
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return <RetryErrorBox message={loadError} onRetry={() => router.refresh()} />;
  }

  const lengthLabel = road?.total_length_meters
    ? `${Math.round(road.total_length_meters).toLocaleString("fa-IR")} متر`
    : "پس از ذخیره محاسبه می‌شود";

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <PanelCard title="مشخصات">
        <div className="grid gap-4 md:grid-cols-2">
          <MyInput
            errMsg={nameError}
            label="نام جاده"
            onValueChange={setName}
            placeholder="مثلاً آزادراه اهواز – بندر امام"
            value={name}
          />
          <RefSelect
            errorMessage={provinceError}
            instanceId="road-province"
            label="استان"
            onChange={setProvince}
            onFilter={(input) =>
              provinceOptions.filter((o) => o.label.includes(input)).slice(0, 30)
            }
            options={provinceOptions}
            placeholder="انتخاب استان"
            value={province}
          />
          <MyInput
            label="مبدأ (اختیاری)"
            onValueChange={setOrigin}
            placeholder="مثلاً اهواز"
            value={origin}
          />
          <MyInput
            label="مقصد (اختیاری)"
            onValueChange={setDestination}
            placeholder="مثلاً بندر امام"
            value={destination}
          />
        </div>
      </PanelCard>

      <PanelCard title="محور جاده">
        <GeoLineDrawer
          errorMessage={areaError}
          fallbackCenter={FALLBACK_CENTER}
          fallbackZoom={6}
          onChange={setArea}
          onClear={() => setArea(null)}
          value={area}
        />
        <p className="mt-3 text-xs text-slate-500">
          طول محور (محاسبه‌شده):{" "}
          <span className="text-slate-300">{lengthLabel}</span> — این عدد از روی
          همین هندسه در سرور ساخته می‌شود و قابل ویرایش نیست.
        </p>
      </PanelCard>

      <PanelCard title="خطوط جاده">
        <RefSelect
          instanceId="road-lanes"
          label="خطوط (lanes)"
          multiple
          onChange={setLanes}
          onFilter={(input) =>
            positionOptions.filter((o) => o.label.includes(input)).slice(0, 30)
          }
          options={positionOptions}
          placeholder="خط اول، شانه راست، …"
          value={lanes}
        />
        <p className="mt-2 text-xs text-slate-500">
          خطوط از فهرست «موقعیت» انتخاب می‌شوند؛ همین‌ها هستند که
          <span className="text-slate-300"> road.snapPointToRoad </span>
          برمی‌گرداند.
        </p>
      </PanelCard>

      <div className="flex items-center gap-2">
        <Button disabled={saving} type="submit">
          {saving ? "در حال ذخیره…" : isEdit ? "ذخیرهٔ تغییرات" : "ایجاد جاده"}
        </Button>
        <Button onClick={() => router.push(adminRecordRoutes.roads())} variant="neutral">
          انصراف
        </Button>
      </div>
    </form>
  );
}

export default RoadForm;
