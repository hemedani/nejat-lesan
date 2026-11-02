import React from "react";
import { EditIcon, HideIcon, TrashIcon, UpdateIcon } from "@/components/atoms/Icons";
import { useRouter } from "next/navigation";

interface UserCardProps {
  id: string;
  first_name?: string;
  last_name?: string;
  father_name?: string;
  mobile?: string;
  email?: string;
  gender?: "Male" | "Female";
  national_number?: string;
  personnel_code?: string;
  level: "Ghost" | "Manager" | "OrgHead" | "UnitHead" | "Editor" | "Enterprise" | "Patrol";
  is_verified: boolean;
  summary?: string;
  onDelete: () => void;
}

const UserCard: React.FC<UserCardProps> = ({
  id,
  first_name,
  last_name,
  father_name,
  mobile,
  email,
  gender,
  national_number,
  personnel_code,
  level,
  is_verified,
  summary,
  onDelete,
}) => {
  const router = useRouter();

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Manager":
        return "bg-danger-soft text-danger-fg border-danger-border";
      case "OrgHead":
        return "tint-violet bg-tint-strong text-tint-fg border-tint-border";
      case "UnitHead":
        return "tint-indigo bg-tint-strong text-tint-fg border-tint-border";
      case "Editor":
        return "bg-brand-soft text-brand-fg border-brand-border";
      case "Enterprise":
        return "tint-purple bg-tint-strong text-tint-fg border-tint-border";
      case "Patrol":
        return "tint-cyan bg-tint-strong text-tint-fg border-tint-border";
      default:
        return "bg-surface-sunken text-fg border-line-strong";
    }
  };

  const getLevelLabel = (level?: string) => {
    switch (level) {
      case "Ghost":
        return "مهمان";
      case "Manager":
        return "مدیر";
      case "OrgHead":
        return "سرپرست سازمان";
      case "UnitHead":
        return "سرپرست واحد";
      case "Editor":
        return "ویرایشگر";
      case "Patrol":
        return "مأمور گشت";
      case "Enterprise":
        return "سازمانی";
      default:
        return "—";
    }
  };

  const getGenderLabel = (gender?: string) => {
    return gender === "Male" ? "مرد" : "زن";
  };

  const getGenderColor = (gender?: string) => {
    return gender === "Male" ? "text-brand-fg" : "text-pink-600";
  };

  return (
    <div className="group flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-line bg-surface/75 p-5 shadow-xl transition hover:-translate-y-0.5 hover:border-line-focus hover:shadow-2xl">
      {/* Header Section */}
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 flex-shrink-0">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-2xl font-semibold text-on-brand shadow-md shadow-brand/20">
            {(first_name?.[0] ?? "")} {(last_name?.[0] ?? "")}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-fg">
              {first_name && last_name
                ? `${first_name} ${last_name}`
                : first_name || last_name || "کاربر"}
            </h2>
            {is_verified && (
              <span className="text-green-500" title="تایید شده">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </div>
            <p className="text-sm text-fg-muted">فرزند: {father_name || "—"}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-line bg-surface-sunken p-3">
          <span className="text-fg-muted block text-xs mb-1">ایمیل</span>
          <span className="text-fg font-medium dir-ltr text-right block break-all">
            {email || "—"}
          </span>
        </div>
        <div className="rounded-xl border border-line bg-surface-sunken p-3">
          <span className="text-fg-muted block text-xs mb-1">کد ملی</span>
          <span className="text-fg font-medium dir-ltr text-right block">{national_number || "—"}</span>
        </div>
        <div className="rounded-xl border border-line bg-surface-sunken p-3">
          <span className="text-fg-muted block text-xs mb-1">شماره همراه</span>
          <span className="text-fg font-medium dir-ltr text-right block">{mobile || "—"}</span>
        </div>
        <div className="rounded-xl border border-line bg-surface-sunken p-3">
          <span className="text-fg-muted block text-xs mb-1">جنسیت</span>
          <span className={`font-medium ${getGenderColor(gender)}`}>{gender ? getGenderLabel(gender) : "—"}</span>
        </div>
        <div className="rounded-xl border border-line bg-surface-sunken p-3">
          <span className="text-fg-muted block text-xs mb-1">سطح دسترسی</span>
          <span
            className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${getLevelColor(level)}`}
          >
            {getLevelLabel(level)}
          </span>
        </div>
      </div>

      {/* Summary Section */}
      <div className="tint-brand rounded-xl border border-tint-border bg-tint-soft p-3">
        <span className="mb-1 block text-xs font-medium text-tint-fg">کد پرسنلی</span>
        <p className="text-sm font-medium text-fg" dir="ltr">{personnel_code || "ثبت نشده"}</p>
      </div>
      {summary && (
        <div className="tint-brand bg-tint-soft rounded-xl p-3 border border-tint-border">
          <span className="text-tint-fg block text-xs font-medium mb-1">خلاصه</span>
          <p className="text-fg-muted text-sm leading-relaxed line-clamp-2">{summary}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-3">
        <button
          onClick={() => router.push(`/admin/users/user/${id}`)}
          className="p-2 bg-brand text-on-brand rounded-lg hover:bg-brand-hover transition-all duration-200 shadow flex items-center gap-1 text-sm"
          title="مشاهده جزئیات"
        >
          <HideIcon />
          <span>جزئیات</span>
        </button>
        <button
          onClick={() => router.push(`/admin/users/edit/relation/${id}`)}
          className="p-2 tint-warning bg-tint-strong text-tint-fg rounded-lg border border-tint-border hover:bg-tint-soft transition-all duration-200 shadow flex items-center gap-1 text-sm"
          title="ویرایش روابط"
        >
          <EditIcon />
          <span>روابط</span>
        </button>
        <button
          onClick={() => router.push(`/admin/users/edit/pure/${id}`)}
          className="p-2 tint-warning bg-tint-strong text-tint-fg rounded-lg border border-tint-border hover:bg-tint-soft transition-all duration-200 shadow flex items-center gap-1 text-sm"
          title="ویرایش اطلاعات"
        >
          <UpdateIcon />
          <span>ویرایش</span>
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 bg-red-500 text-on-brand rounded-lg hover:bg-red-600 transition-all duration-200 shadow flex items-center gap-1 text-sm"
            title="حذف"
          >
            <TrashIcon />
            <span>حذف</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default UserCard;
