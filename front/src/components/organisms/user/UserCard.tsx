import React from "react";
import { EditIcon, HideIcon, TrashIcon, UpdateIcon } from "@/components/atoms/Icons";
import { useRouter } from "next/navigation";

interface UserCardProps {
  id: string;
  first_name: string;
  last_name: string;
  father_name: string;
  mobile: string;
  gender: "Male" | "Female";
  national_number: string;
  level: "Ghost" | "Manager" | "Editor" | "Enterprise";
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
  gender,
  national_number,
  level,
  is_verified,
  summary,
  onDelete,
}) => {
  const router = useRouter();

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Manager":
        return "bg-red-100 text-red-800 border-red-300";
      case "Editor":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Enterprise":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getGenderLabel = (gender: string) => {
    return gender === "Male" ? "مرد" : "زن";
  };

  const getGenderColor = (gender: string) => {
    return gender === "Male" ? "text-blue-600" : "text-pink-600";
  };

  return (
    <div className="border w-full max-w-lg bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4">
      {/* Header Section */}
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 flex-shrink-0">
          <div className="w-full h-full bg-gradient-to-r from-blue-400 to-green-400 flex items-center justify-center rounded-full text-white text-2xl font-semibold shadow-md">
            {first_name[0]} {last_name[0]}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-gray-800">
              {first_name} {last_name}
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
          <p className="text-gray-600 text-sm">فرزند: {father_name}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-gray-500 block text-xs mb-1">کد ملی</span>
          <span className="text-gray-800 font-medium dir-ltr text-right block">{national_number}</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-gray-500 block text-xs mb-1">شماره همراه</span>
          <span className="text-gray-800 font-medium dir-ltr text-right block">{mobile}</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-gray-500 block text-xs mb-1">جنسیت</span>
          <span className={`font-medium ${getGenderColor(gender)}`}>{getGenderLabel(gender)}</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-gray-500 block text-xs mb-1">سطح دسترسی</span>
          <span
            className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${getLevelColor(level)}`}
          >
            {level === "Ghost"
              ? "مهمان"
              : level === "Manager"
                ? "مدیر"
                : level === "Editor"
                  ? "ویرایشگر"
                  : "سازمانی"}
          </span>
        </div>
      </div>

      {/* Summary Section */}
      {summary && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <span className="text-blue-700 block text-xs font-medium mb-1">خلاصه</span>
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">{summary}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
        <button
          onClick={() => router.push(`/admin/users/user/${id}`)}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow flex items-center gap-1 text-sm"
          title="مشاهده جزئیات"
        >
          <HideIcon />
          <span>جزئیات</span>
        </button>
        <button
          onClick={() => router.push(`/admin/users/edit/relation/${id}`)}
          className="p-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition-all duration-200 shadow flex items-center gap-1 text-sm"
          title="ویرایش روابط"
        >
          <EditIcon />
          <span>روابط</span>
        </button>
        <button
          onClick={() => router.push(`/admin/users/edit/pure/${id}`)}
          className="p-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition-all duration-200 shadow flex items-center gap-1 text-sm"
          title="ویرایش اطلاعات"
        >
          <UpdateIcon />
          <span>ویرایش</span>
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 shadow flex items-center gap-1 text-sm"
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
