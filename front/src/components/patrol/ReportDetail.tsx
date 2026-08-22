"use client";

import type { PatrolReport } from "@/types/patrol";
import { StatusBadge } from "@/components/patrol/StatusBadge";
import { ReportLocationMap } from "@/components/patrol/ReportLocationMap";
import { ReviewHistory } from "@/components/patrol/ReviewHistory";
import { ReviewActions } from "@/components/patrol/ReviewActions";
import { ResubmitAction } from "@/components/patrol/ResubmitAction";
import { formatDate, fullName } from "@/components/patrol/ReportList";

export function ReportDetail({ report, history, manager, onRefresh }: { report: PatrolReport; history: import("@/types/patrol").ReviewHistoryItem[]; manager: boolean; onRefresh: () => Promise<void> | void }) {
  return <div className="space-y-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-sm text-blue-300">گزارش گشت</p><h1 className="mt-1 text-2xl font-bold text-white">{report.report_id || `#${report.serial || report._id.slice(-6)}`}</h1><p className="mt-2 text-sm text-slate-500">ثبت‌شده در {formatDate(report.reported_at)}</p></div><div className="flex flex-wrap gap-2"><StatusBadge kind="sync" value={report.sync_status} /><StatusBadge kind="review" value={report.review_status} /></div></div>
    {report.review_reason && <div className="rounded-2xl border border-orange-400/25 bg-orange-400/10 p-4"><p className="text-xs text-orange-200">دلیل اصلاح</p><p className="mt-2 text-sm leading-7 text-orange-50">{report.review_reason}</p></div>}
    {manager && <section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5"><h2 className="mb-4 font-semibold text-white">اقدامات بررسی</h2><ReviewActions report={report} onComplete={onRefresh} /></section>}
    {!manager && <section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5"><ResubmitAction report={report} onComplete={onRefresh} /></section>}
    <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5"><h2 className="mb-4 font-semibold text-white">زمینه گزارش</h2><div className="grid grid-cols-2 gap-4 text-sm"><Info label="گزارش‌دهنده" value={fullName(report.officer)} /><Info label="کد پرسنلی" value={report.officer?.personnel_code} /><Info label="واحد گشت" value={report.patrol_unit?.name || report.patrol_unit?.code} /><Info label="خودرو" value={report.vehicle?.plaque_no} /><Info label="تاریخ حادثه" value={formatDate(report.date_of_accident)} /><Info label="نوع حادثه" value={report.type?.name} /><Info label="نوع برخورد" value={report.collision_type?.name} /><Info label="جهت حرکت" value={report.travel_direction} /><Info label="کیلومتر" value={report.kilometer == null ? undefined : String(report.kilometer)} /><Info label="متر" value={report.meter == null ? undefined : String(report.meter)} /><Info label="دقت GPS" value={report.gps_accuracy == null ? undefined : `${report.gps_accuracy} متر`} /></div></section><section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5"><h2 className="mb-4 font-semibold text-white">موقعیت‌ها</h2><ReportLocationMap location={report.location} gps={report.gps_coords} /></section></div>
    <section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5"><h2 className="mb-5 font-semibold text-white">سابقه بررسی</h2><ReviewHistory items={history} /></section>
    <section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5"><h2 className="mb-4 font-semibold text-white">داده‌های تکمیلی</h2><div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><Info label="وسایل نقلیه" value={report.vehicle_dtos?.length == null ? undefined : String(report.vehicle_dtos.length)} /><Info label="اشخاص" value={report.people_dtos?.length == null ? undefined : String(report.people_dtos.length)} /><Info label="خسارت تأسیسات" value={report.facility_damage_dtos?.length == null ? undefined : String(report.facility_damage_dtos.length)} /><Info label="پیوست‌ها" value={report.attachments?.length == null ? undefined : String(report.attachments.length)} /></div></section>
  </div>;
}

function Info({ label, value }: { label: string; value?: string }) { return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-words text-slate-200">{value || "در دسترس نیست"}</p></div>; }
