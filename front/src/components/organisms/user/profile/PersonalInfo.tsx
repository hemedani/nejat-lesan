import { format } from "date-fns-jalali";
import { translateGender } from "@/utils/helper";
import { userSchema } from "@/types/declarations/selectInp";
import { UserIcon, CalendarIcon } from "@/components/atoms/Icons";

interface PersonalInfoProps {
  user: userSchema;
}

const PersonalInfo = ({ user }: PersonalInfoProps) => {
  return (
    <div className="space-y-4">
      <div className="group bg-gray-50/50 hover:bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <UserIcon className="w-5 h-5" />
          </div>
          <label className="text-sm font-medium text-gray-600">نام پدر</label>
        </div>
        <p className="text-gray-800 font-medium pr-11">{user.father_name}</p>
      </div>

      <div className="group bg-gray-50/50 hover:bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <UserIcon className="w-5 h-5" />
          </div>
          <label className="text-sm font-medium text-gray-600">جنسیت</label>
        </div>
        <p className="text-gray-800 font-medium pr-11">
          {translateGender(user.gender)}
        </p>
      </div>

      <div className="group bg-gray-50/50 hover:bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <label className="text-sm font-medium text-gray-600">
            تاریخ تولد
          </label>
        </div>
        <p className="text-gray-800 font-medium pr-11">
          {user.birth_date
            ? format(new Date(user.birth_date), "yyyy/MM/dd")
            : "نامشخص"}
        </p>
      </div>

      <div className="group bg-gray-50/50 hover:bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <UserIcon className="w-5 h-5" />
          </div>
          <label className="text-sm font-medium text-gray-600">
            کد ملی
          </label>
        </div>
        <p className="text-gray-800 font-medium pr-11">
          {user.national_number || "نامشخص"}
        </p>
      </div>
    </div>
  );
};

export default PersonalInfo;
