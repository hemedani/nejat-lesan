"use client";

import { useEffect, useMemo, useState } from "react";
import { adminRecordRoutes } from "@/utils/admin-record-routes";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { addOrganization } from "@/app/actions/organization/addOrganization";
import { updateOrganization } from "@/app/actions/organization/updateOrganization";
import { gets as getRoadsAction } from "@/app/actions/road/gets";
import { getUsers } from "@/app/actions/user/getUsers";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { OrganizationListItem } from "@/services/org-projections";
import GeoPointPicker, { type GeoPoint } from "@/components/maps/GeoPointPicker";
import { PanelCard } from "@/components/patrol/ui";
import { Button } from "@/components/atoms/Button";
import MyInput from "@/components/atoms/MyInput";
import RefSelect, { type RefOption } from "@/components/atoms/RefSelect";
import ToggleSwitch from "@/components/atoms/ToggleSwitch";

type RoadOption = { _id: string; name: string };
type ManagerUser = { _id: string; first_name?: string; last_name?: string; personnel_code?: string };

export type OrganizationFormProps = {
  /** `null` یعنی ساختِ تازه. */
  organization: OrganizationListItem | null;
};

/** ایران — قاب نقشه پیش از اینکه نقطه‌ای انتخاب شود. */
const FALLBACK_CENTER = { lat: 32.4279, lng: 53.688 };

/**
 * همان بازه‌ای که نقشهٔ وب خودش اعمال می‌کند
 * (`mobile/src/services/map-web-html.ts`) و اپ مأمور هم در
 * `domain/organization.ts` بیضی می‌کند. بک‌اند عدد را ذخیره می‌کند ولی
 * بازه‌اش را تضمین نمی‌کند، پس اعتبارسنجی اینجاست.
 */
const MIN_ZOOM = 3;
const MAX_ZOOM = 19;
const DEFAULT_ZOOM = 14;

const roadOption = (r: { _id: string; name: string }): RefOption => ({
  value: r._id,
  label: r.name,
});

const userOption = (u: ManagerUser): RefOption => ({
  value: u._id,
  label: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.personnel_code || u._id,
});

/**
 * فرم سازمان — مشترک بین «ساخت» و «ویرایش».
 *
 * `roadId` عمداً روی **update** هم فرستاده می‌شود، با اینکه validator آن را
 * ندارد: `organization.road` یک‌بار تعیین می‌شود و بک‌اند آن را تغییر نمی‌دهد.
 * پس کاربر نمی‌تواند راهِ سازمان را عوض کند و نباید بتواند — راه‌ها همین
 * با `road.organization` یک‌به‌یک قفل شده‌اند.
 */
export function OrganizationForm({ organization }: OrganizationFormProps) {
  const router = useRouter();
  const isEdit = Boolean(organization?._id);

  const [code, setCode] = useState(organization?.code ?? "");
  const [name, setName] = useState(organization?.name ?? "");
  const [enName, setEnName] = useState(organization?.enName ?? "");
  const [description, setDescription] = useState(organization?.description ?? "");
  const [isActive, setIsActive] = useState(organization?.is_active ?? true);
  const [road, setRoad] = useState<RefOption | null>(
    organization?.road?._id
      ? { value: organization.road._id, label: organization.road.name }
      : null,
  );
  const [head, setHead] = useState<RefOption | null>(
    organization?.head?._id
      ? userOption(organization.head as ManagerUser)
      : null,
  );
  const [location, setLocation] = useState<GeoPoint | null>(
    (organization?.location as GeoPoint) ?? null,
  );
  const [zoom, setZoom] = useState(
    String(organization?.location_zoom ?? DEFAULT_ZOOM),
  );

  const [roads, setRoads] = useState<RoadOption[]>([]);
  const [managers, setManagers] = useState<ManagerUser[]>([]);
  const [saving, setSaving] = useState(false);

  // این دو بارگذاری **اختیاری**اند: فقط لیست‌های dropdown را پر می‌کنند.
  // خطای یکی از آن‌ها نباید کل فرم را به صفحه‌ی خطا تبدیل کند — سرپرست و
  // جاده هر دو فیلد اختیاری‌اند و فرم با لیست خالی هنوز قابل ثبت است.
  //
  // عمداً دو `try` جدا هستند نه یک `Promise.all`: با یک `try`، شکستِ یکی از
  // آن‌ها هر دو را می‌برد و کاربر یک پیام بی‌معنا می‌بیند به‌جای فرمی که
  // کار می‌کند.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const roads = unwrapApiResponse<RoadOption[]>(
          await getRoadsAction({
            set: { page: 1, limit: 200 },
            get: { _id: 1, name: 1, origin: 1, destination: 1 },
          }),
        );
        if (alive && Array.isArray(roads)) setRoads(roads);
      } catch {
        if (alive) setRoads([]);
      }

      try {
        const users = await getUsers({
          // فقط مدیران: سرپرست سازمان یک نقشِ سازمانی است.
          set: { levels: "Manager", page: 1, limit: 200 },
          get: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            personnel_code: 1,
            is_active: 1,
          },
        });
        if (alive && Array.isArray(users)) {
          setManagers(users as ManagerUser[]);
        }
      } catch {
        if (alive) setManagers([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const roadOptions = useMemo(() => roads.map(roadOption), [roads]);
  const managerOptions = useMemo(() => managers.map(userOption), [managers]);

  const [codeError, setCodeError] = useState<string | undefined>();
  const [nameError, setNameError] = useState<string | undefined>();
  const [zoomError, setZoomError] = useState<string | undefined>();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setCodeError(undefined);
    setNameError(undefined);
    setZoomError(undefined);

    if (!code.trim()) {
      setCodeError("کد سازمان الزامی است.");
      return;
    }
    if (!name.trim()) {
      setNameError("نام سازمان الزامی است.");
      return;
    }

    const parsedZoom = Number(zoom);
    if (location) {
      if (!Number.isInteger(parsedZoom) || parsedZoom < MIN_ZOOM || parsedZoom > MAX_ZOOM) {
        setZoomError(`بزرگ‌نمایی باید عدد صحیح بین ${MIN_ZOOM} تا ${MAX_ZOOM} باشد.`);
        return;
      }
    }

    setSaving(true);
    try {
      const response = isEdit
        ? await updateOrganization({
            set: {
              _id: organization!._id,
              code: code.trim(),
              name: name.trim(),
              enName: enName.trim(),
              description: description.trim(),
              is_active: isActive,
              // نقطه و بزرگ‌نمایی روی update اختیاری‌اند، پس مقدارِ خالی
              // یعنی «پاک کن» — حذفِ کلید یعنی «نگه دار».
              location: location ?? undefined,
              location_zoom: location ? parsedZoom : undefined,
              ...(head ? { headId: head.value } : {}),
            },
          })
        : await addOrganization({
            set: {
              code: code.trim(),
              name: name.trim(),
              enName: enName.trim() || undefined,
              description: description.trim() || undefined,
              is_active: isActive,
              location: location ?? undefined,
              location_zoom: location ? parsedZoom : undefined,
              ...(road ? { roadId: road.value } : {}),
              ...(head ? { headId: head.value } : {}),
            },
          });

      if (!response.success) {
        const message = (response.body as { message?: string } | undefined)?.message ?? "";
        toast.error(getPatrolErrorMessage(new Error(message)));
        return;
      }

      toast.success(isEdit ? "سازمان به‌روزرسانی شد." : "سازمان ایجاد شد.");
      router.push(adminRecordRoutes.orgs());
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <PanelCard title="مشخصات سازمان">
        <div className="grid gap-4 md:grid-cols-2">
          <MyInput
            errMsg={codeError}
            label="کد سازمان"
            onValueChange={setCode}
            placeholder="مثلاً AHR"
            value={code}
          />
          <MyInput
            errMsg={nameError}
            label="نام سازمان"
            onValueChange={setName}
            placeholder="نام فارسی راه/آزادراه یا شهرداری"
            value={name}
          />
          <MyInput
            label="نام انگلیسی (اختیاری)"
            onValueChange={setEnName}
            value={enName}
          />
          <MyInput
            label="توضیحات (اختیاری)"
            onValueChange={setDescription}
            rows={3}
            type="textarea"
            value={description}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <RefSelect
            disabled={isEdit}
            instanceId="org-road"
            label="جاده/آزادراه"
            onChange={setRoad}
            onFilter={(input) =>
              roadOptions.filter((o) => o.label.includes(input)).slice(0, 30)
            }
            options={roadOptions}
            placeholder={
              isEdit
                ? "راه سازمان پس از ساخت قابل تغییر نیست"
                : "اختیاری — برای شهرداری‌ها خالی بگذارید"
            }
            value={road}
          />
          <RefSelect
            instanceId="org-head"
            label="سرپرست سازمان (اختیاری)"
            onChange={setHead}
            onFilter={(input) =>
              managerOptions.filter((o) => o.label.includes(input)).slice(0, 30)
            }
            options={managerOptions}
            placeholder="انتخاب کاربر"
            value={head}
          />
        </div>

        {isEdit && road && (
          <p className="mt-2 text-xs text-slate-500">
            راه سازمان یک‌بار تعیین می‌شود و با <span className="text-slate-300">road.organization</span>{" "}
            یک‌به‌یک قفل است؛ برای تعویض باید سازمان تازه‌ای ساخته شود.
          </p>
        )}

        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[.02] px-3 py-3">
          <span className="text-sm text-slate-300">سازمان فعال باشد</span>
          <ToggleSwitch checked={isActive} onChange={setIsActive} />
        </div>
      </PanelCard>

      <PanelCard title="مرکز عملیاتی سازمان">
        <p className="mb-3 text-xs text-slate-500">
          نقشهٔ اپلیکیشن مأمور روی این نقطه باز می‌شود (وقتی GPS در دسترس نیست)
          و دکمهٔ «مرکز سازمان» روی همین‌جا می‌رود. مختصات به ترتیب
          <span className="text-slate-300"> [طول, عرض]</span> ذخیره می‌شوند.
        </p>
        <GeoPointPicker
          fallbackCenter={FALLBACK_CENTER}
          fallbackZoom={6}
          onChange={setLocation}
          onClear={() => setLocation(null)}
          value={location}
        />
        {location && (
          <div className="mt-3 max-w-[12rem]">
            <MyInput
              errMsg={zoomError}
              label="بزرگ‌نمایی پیش‌فرض نقشه"
              onValueChange={setZoom}
              type="number"
              value={zoom}
            />
          </div>
        )}
      </PanelCard>

      <div className="flex items-center gap-2">
        <Button disabled={saving} type="submit">
          {saving ? "در حال ذخیره…" : isEdit ? "ذخیرهٔ تغییرات" : "ایجاد سازمان"}
        </Button>
        <Button onClick={() => router.push(adminRecordRoutes.orgs())} variant="neutral">
          انصراف
        </Button>
      </div>
    </form>
  );
}

export default OrganizationForm;
