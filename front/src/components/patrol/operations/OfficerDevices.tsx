"use client";

import { useCallback, useState } from "react";
import { getUserDevices } from "@/app/actions/user/getUserDevices";
import { revokeDevice } from "@/app/actions/user/revokeDevice";
import { removeDevice } from "@/app/actions/user/removeDevice";
import { getPatrolErrorMessage, unwrapApiResponse } from "@/utils/api-response";
import { ToastNotify } from "@/utils/helper";
import { Button } from "@/components/atoms/Button";

type Device = {
  _id: string;
  device_id?: string;
  platform?: string;
  app_version?: string;
  model?: string;
  is_active?: boolean;
  last_seen_at?: string;
  registered_at?: string;
  revoked_at?: string;
  push_token?: string;
};

const deviceProjection = {
  _id: 1,
  device_id: 1,
  platform: 1,
  app_version: 1,
  model: 1,
  is_active: 1,
  last_seen_at: 1,
  registered_at: 1,
  revoked_at: 1,
  push_token: 1,
} as const;

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString("fa-IR") : "نامشخص";

export function OfficerDevices({ officerId }: { officerId: string }) {
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getUserDevices({
        set: { userId: officerId },
        get: deviceProjection as never,
      });
      setDevices(unwrapApiResponse<Device[]>(response) || []);
    } catch (cause) {
      ToastNotify("error", getPatrolErrorMessage(cause));
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [officerId]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && devices === null) void load();
  };

  const mutate = async (operation: () => Promise<unknown>, successMessage: string, deviceId: string) => {
    setBusyId(deviceId);
    try {
      unwrapApiResponse(await operation());
      ToastNotify("success", successMessage);
      await load();
    } catch (cause) {
      ToastNotify("error", getPatrolErrorMessage(cause));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mt-3 border-t border-white/5 pt-3">
      <button
        onClick={toggle}
        className="text-xs text-blue-300 transition-colors hover:text-cyan-200"
        type="button"
      >
        {open ? "بستن دستگاه‌ها" : "مدیریت دستگاه‌ها"}
        {devices?.length ? ` (${devices.length.toLocaleString("fa-IR")})` : ""}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {loading && <p className="text-xs text-slate-500">در حال دریافت دستگاه‌ها…</p>}
          {!loading && devices && !devices.length && (
            <p className="text-xs text-slate-600">هیچ دستگاهی برای این مأمور ثبت نشده است.</p>
          )}
          {!loading &&
            devices?.map((device) => (
              <div key={device._id} className="rounded-xl border border-white/5 bg-white/[.03] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-200">
                      {device.platform || "پلتفرم نامشخص"}
                      {device.model ? ` · ${device.model}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      نسخه {device.app_version || "—"} · آخرین حضور: {formatDateTime(device.last_seen_at)}
                    </p>
                    <p className="mt-1 break-all text-[11px] text-slate-600">{device.device_id}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${
                      device.is_active ? "bg-emerald-400/10 text-emerald-200" : "bg-rose-400/10 text-rose-200"
                    }`}
                  >
                    {device.is_active ? "فعال" : "لغو شده"}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${device.push_token ? "bg-emerald-400" : "bg-slate-600"}`}
                    title={device.push_token ? "توکن نوتیفیکیشن ثبت شده" : "بدون توکن نوتیفیکیشن"}
                  />
                  <span className="text-[11px] text-slate-500">
                    {device.push_token ? "Push فعال" : "Push ثبت نشده"}
                  </span>
                </div>
                {device.is_active && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="warning"
                      disabled={busyId === device._id}
                      onClick={() =>
                        void mutate(
                          () => revokeDevice({ set: { deviceId: device._id }, get: { _id: 1, is_active: 1 } as never }),
                          "دستگاه لغو شد (خروج اجباری).",
                          device._id,
                        )
                      }
                    >
                      لغو دسترسی
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busyId === device._id}
                      onClick={() => {
                        if (window.confirm("آیا از حذف کامل دستگاه مطمئن هستید؟")) {
                          void mutate(
                            () => removeDevice({ set: { deviceId: device._id } }),
                            "دستگاه حذف شد.",
                            device._id,
                          );
                        }
                      }}
                    >
                      حذف
                    </Button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
