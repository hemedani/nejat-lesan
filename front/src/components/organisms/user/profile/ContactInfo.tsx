import { userSchema } from "@/types/declarations/selectInp";
import { PhoneIcon, IdCardIcon, MapPinIcon } from "@/components/atoms/Icons";

interface ContactInfoProps {
  user: userSchema;
}

const ContactInfo = ({ user }: ContactInfoProps) => {
  return (
    <div className="space-y-4">
      <div className="group bg-gray-50/50 hover:bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <PhoneIcon className="w-5 h-5" />
          </div>
          <label className="text-sm font-medium text-gray-600">
            شماره موبایل
          </label>
        </div>
        <p className="text-gray-800 font-medium pr-11">{user.mobile}</p>
      </div>

      <div className="group bg-gray-50/50 hover:bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <IdCardIcon className="w-5 h-5" />
          </div>
          <label className="text-sm font-medium text-gray-600">کد ملی</label>
        </div>
        <p className="text-gray-800 font-medium pr-11">
          {user.national_number || "نامشخص"}
        </p>
      </div>

      <div className="group bg-gray-50/50 hover:bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <MapPinIcon className="w-5 h-5" />
          </div>
          <label className="text-sm font-medium text-gray-600">آدرس</label>
        </div>
        <p className="text-gray-800 font-medium pr-11">
          {user.address || "نامشخص"}
        </p>
      </div>
    </div>
  );
};

export default ContactInfo;
