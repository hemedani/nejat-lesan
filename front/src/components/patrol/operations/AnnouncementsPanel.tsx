"use client";

import { useCallback, useEffect, useState } from "react";
import { addAnnouncement } from "@/app/actions/announcement/add";
import { getAnnouncements } from "@/app/actions/announcement/gets";
import { getPatrolErrorMessage, unwrapApiResponse } from "@/utils/api-response";
import { ToastNotify } from "@/utils/helper";
import { Button } from "@/components/atoms/Button";
import MyInput from "@/components/atoms/MyInput";
import SelectBox from "@/components/atoms/Select";
import MyStandaloneDatePicker from "@/components/atoms/MyStandaloneDatePicker";
import { EmptyState, Notice, PanelCard } from "@/components/patrol/ui";

type Announcement = {
  _id: string;
  title?: string;
  body?: string;
  priority?: string;
  target_roles?: string[];
  target_user_ids?: string[];
  target_patrol_units?: string[];
  expires_at?: string;
  is_active?: boolean;
  createdAt?: string;
  reads?: { _id: string; read_at?: string }[];
};

type UnitOption = { _id: string; name?: string; code?: string };

const PRIORITY_OPTIONS = [
  { value: "info", label: "اطلاعی" },
  { value: "warning", label: "هشدار" },
  { value: "critical", label: "فوری" },
] as const;

const ROLE_OPTIONS = [
  { value: "Patrol", label: "مأموران گشت" },
  { value: "Manager", label: "مدیران" },
] as const;

const priorityStyles: Record<string, string> = {
  info: "bg-blue-400/10 text-blue-200",
  warning: "bg-amber-400/10 text-amber-200",
  critical: "bg-rose-400/10 text-rose-200",
};

const priorityLabels: Record<string, string> = {
  info: "اطلاعی",
  warning: "هشدار",
  critical: "فوری",
};

const announcementProjection = {
  _id: 1,
  title: 1,
  body: 1,
  priority: 1,
  target_roles: 1,
  target_patrol_units: 1,
  expires_at: 1,
  is_active: 1,
  createdAt: 1,
  reads: { _id: 1, read_at: 1 },
} as const;

export function AnnouncementsPanel({ units }: { units: UnitOption[] }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("info");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["Patrol"]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await getAnnouncements({
        set: { page: 1, limit: 50 },
        get: announcementProjection as never,
      });
      setAnnouncements(unwrapApiResponse<Announcement[]>(response) || []);
    } catch (cause) {
      setLoadError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleValue = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setPending(true);
    try {
      unwrapApiResponse(
        await addAnnouncement({
          set: {
            title: title.trim(),
            body: body.trim(),
            priority,
            ...(selectedRoles.length ? { target_roles: selectedRoles } : {}),
            ...(selectedUnits.length ? { target_patrol_units: selectedUnits } : {}),
            ...(expiresAt ? { expires_at: expiresAt.toISOString() } : {}),
          },
          get: { _id: 1, title: 1 },
        }),
      );
      setTitle("");
      setBody("");
      setPriority("info");
      setSelectedRoles(["Patrol"]);
      setSelectedUnits([]);
      setExpiresAt(null);
      ToastNotify("success", "اطلاعیه منتشر شد.");
      await load();
    } catch (cause) {
      ToastNotify("error", getPatrolErrorMessage(cause));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5">
      <PanelCard title="اطلاعیه جدید">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
            <MyInput variant="dark" name="announcement-title" label="عنوان" value={title} onValueChange={setTitle} />
            <SelectBox
              label="اولویت"
              name="announcement-priority"
              value={priority}
              onValueChange={setPriority}
              options={PRIORITY_OPTIONS.map((option) => ({ ...option }))}
            />
          </div>

          <MyInput variant="dark" name="announcement-body" label="متن اطلاعیه" type="textarea" value={body} onValueChange={setBody} />

          <div className="grid gap-3 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-right text-sm font-medium text-slate-300">گروه هدف</p>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRoles((current) => toggleValue(current, role.value))}
                    className={`rounded-xl px-3 py-2 text-xs transition ${
                      selectedRoles.includes(role.value)
                        ? "bg-blue-600 font-semibold text-white"
                        : "border border-white/10 bg-white/[.04] text-slate-400 hover:text-white"
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-right text-sm font-medium text-slate-300">واحدهای هدف</p>
              <div className="flex flex-wrap gap-2">
                {units.slice(0, 8).map((unit) => (
                  <button
                    key={unit._id}
                    type="button"
                    onClick={() => setSelectedUnits((current) => toggleValue(current, unit._id))}
                    className={`rounded-xl px-3 py-2 text-xs transition ${
                      selectedUnits.includes(unit._id)
                        ? "bg-cyan-600 font-semibold text-white"
                        : "border border-white/10 bg-white/[.04] text-slate-400 hover:text-white"
                    }`}
                  >
                    {unit.name || unit.code || unit._id.slice(0, 6)}
                  </button>
                ))}
                {!units.length && <span className="text-xs text-slate-600">واحدی ثبت نشده است.</span>}
              </div>
            </div>
            <MyStandaloneDatePicker
              label="تاریخ انقضا (اختیاری)"
              value={expiresAt}
              onChange={setExpiresAt}
              placeholder="بدون انقضا"
            />
          </div>

          {!selectedRoles.length && !selectedUnits.length && (
            <Notice tone="amber">بدون انتخاب گروه یا واحد، اطلاعیه برای هیچ مأموری نمایش داده نمی‌شود.</Notice>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !title.trim() || !body.trim()} loading={pending}>
              انتشار اطلاعیه
            </Button>
          </div>
        </form>
      </PanelCard>

      <PanelCard title="اطلاعیه‌های منتشرشده">
        {loadError && <Notice tone="rose">{loadError}</Notice>}
        {loading && !loadError && <p className="text-sm text-slate-500">در حال دریافت…</p>}
        {!loading && !loadError && (
          <div className="space-y-3">
            {announcements.length ? (
              announcements.map((item) => (
                <article key={item._id} className="rounded-xl border border-white/5 bg-white/[.03] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-[11px] ${priorityStyles[item.priority || "info"]}`}>
                        {priorityLabels[item.priority || "info"]}
                      </span>
                      <h3 className="font-medium text-white">{item.title}</h3>
                    </div>
                    <span className="text-xs text-slate-500">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString("fa-IR") : ""}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>خوانده‌شده: {(item.reads?.length || 0).toLocaleString("fa-IR")}</span>
                    {item.target_roles?.length ? <span>گروه‌ها: {item.target_roles.join("، ")}</span> : null}
                    {item.target_patrol_units?.length ? (
                      <span>
                        واحدها:{" "}
                        {item.target_patrol_units
                          .map((id) => units.find((unit) => unit._id === id)?.name || "—")
                          .join("، ")}
                      </span>
                    ) : null}
                    {item.expires_at ? (
                      <span>انقضا: {new Date(item.expires_at).toLocaleDateString("fa-IR")}</span>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="هنوز اطلاعیه‌ای منتشر نشده است." />
            )}
          </div>
        )}
      </PanelCard>
    </div>
  );
}
