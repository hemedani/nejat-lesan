"use client";

import type { ReviewHistoryItem } from "@/types/patrol";
import type { PatrolReport } from "@/types/patrol";
import { StatusBadge } from "@/components/patrol/StatusBadge";
import { ReportLocationMap } from "@/components/patrol/ReportLocationMap";
import { ReviewHistory } from "@/components/patrol/ReviewHistory";
import { ReviewActions } from "@/components/patrol/ReviewActions";
import { ResubmitAction } from "@/components/patrol/ResubmitAction";
import { InfoRow, Notice, PanelCard } from "@/components/patrol/ui";
import { formatDate, fullName } from "@/components/patrol/ReportList";

export function ReportDetail({
  report,
  history,
  manager,
  onRefresh,
}: {
  report: PatrolReport;
  history: ReviewHistoryItem[];
  manager: boolean;
  onRefresh: () => Promise<void> | void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm text-blue-300">گزارش گشت</p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            {report.report_id || `#${report.serial || report._id.slice(-6)}`}
          </h1>
          <p className="mt-2 text-sm text-slate-500">ثبت‌شده در {formatDate(report.reported_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge kind="sync" value={report.sync_status} />
          <StatusBadge kind="review" value={report.review_status} />
        </div>
      </div>

      {report.review_reason && (
        <Notice tone="amber">
          <p className="text-xs text-orange-200">دلیل اصلاح</p>
          <p className="mt-2 text-sm leading-7 text-orange-50">{report.review_reason}</p>
        </Notice>
      )}

      {manager ? (
        <PanelCard title="اقدامات بررسی">
          <ReviewActions report={report} onComplete={onRefresh} />
        </PanelCard>
      ) : (
        <PanelCard title="اقدام مأمور">
          <ResubmitAction report={report} onComplete={onRefresh} />
        </PanelCard>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <PanelCard title="زمینه گزارش">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="گزارش‌دهنده" value={fullName(report.officer)} />
            <InfoRow label="کد پرسنلی" value={report.officer?.personnel_code} />
            <InfoRow label="واحد گشت" value={report.patrol_unit?.name || report.patrol_unit?.code} />
            <InfoRow label="خودرو" value={report.vehicle?.plaque_no} />
            <InfoRow label="تاریخ حادثه" value={formatDate(report.date_of_accident)} />
            <InfoRow label="نوع حادثه" value={report.type?.name} />
            <InfoRow label="نوع برخورد" value={report.collision_type?.name} />
            <InfoRow label="جهت حرکت" value={report.travel_direction} />
            <InfoRow
              label="کیلومتر"
              value={report.kilometer == null ? undefined : String(report.kilometer)}
            />
            <InfoRow label="متر" value={report.meter == null ? undefined : String(report.meter)} />
            <InfoRow
              label="دقت GPS"
              value={report.gps_accuracy == null ? undefined : `${report.gps_accuracy} متر`}
            />
          </div>
        </PanelCard>
        <PanelCard title="موقعیت‌ها">
          <ReportLocationMap location={report.location} gps={report.gps_coords} />
        </PanelCard>
      </div>

      <PanelCard title="سابقه بررسی">
        <ReviewHistory items={history} />
      </PanelCard>

      <PanelCard title="داده‌های تکمیلی">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <InfoRow
            label="وسایل نقلیه"
            value={report.vehicle_dtos?.length == null ? undefined : String(report.vehicle_dtos.length)}
          />
          <InfoRow
            label="اشخاص"
            value={report.people_dtos?.length == null ? undefined : String(report.people_dtos.length)}
          />
          <InfoRow
            label="خسارت تأسیسات"
            value={
              report.facility_damage_dtos?.length == null
                ? undefined
                : String(report.facility_damage_dtos.length)
            }
          />
          <InfoRow
            label="پیوست‌ها"
            value={report.attachments?.length == null ? undefined : String(report.attachments.length)}
          />
        </div>
      </PanelCard>
    </div>
  );
}
