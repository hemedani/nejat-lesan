import { userSchema } from "@/types/declarations/selectInp";
import { PhoneIcon, IdCardIcon, MapPinIcon } from "@/components/atoms/Icons";

interface ContactInfoProps {
  user: userSchema;
}

const ContactInfo = ({ user }: ContactInfoProps) => {
  return (
    <div className="space-y-4">
      <div className="group bg-canvas/50 hover:bg-surface-hover p-4 rounded-lg border border-line transition-all duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 tint-brand bg-tint-soft rounded-lg text-tint-fg">
            <PhoneIcon className="w-5 h-5" />
          </div>
          <label className="text-sm font-medium text-fg-muted">
            شماره موبایل
          </label>
        </div>
        <p className="text-fg font-medium pr-11">{user.mobile}</p>
      </div>

      <div className="group bg-canvas/50 hover:bg-surface-hover p-4 rounded-lg border border-line transition-all duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 tint-brand bg-tint-soft rounded-lg text-tint-fg">
            <IdCardIcon className="w-5 h-5" />
          </div>
          <label className="text-sm font-medium text-fg-muted">کد ملی</label>
        </div>
        <p className="text-fg font-medium pr-11">
          {user.national_number || "نامشخص"}
        </p>
      </div>

      <div className="group bg-canvas/50 hover:bg-surface-hover p-4 rounded-lg border border-line transition-all duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 tint-brand bg-tint-soft rounded-lg text-tint-fg">
            <MapPinIcon className="w-5 h-5" />
          </div>
          <label className="text-sm font-medium text-fg-muted">آدرس</label>
        </div>
        <p className="text-fg font-medium pr-11">
          {user.address || "نامشخص"}
        </p>
      </div>
    </div>
  );
};

export default ContactInfo;
