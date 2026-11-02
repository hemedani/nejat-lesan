import { userSchema } from "@/types/declarations/selectInp";
import { DocumentTextIcon } from "@/components/atoms/Icons";

interface SummarySectionProps {
  user: userSchema;
}

const SummarySection = ({ user }: SummarySectionProps) => {
  return (
    <div className="col-span-full">
      <div className="group bg-canvas/50 hover:bg-surface-hover p-4 rounded-lg border border-line transition-all duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 tint-brand bg-tint-soft rounded-lg text-tint-fg">
            <DocumentTextIcon className="w-5 h-5" />
          </div>
          <label className="text-sm font-medium text-fg-muted">خلاصه</label>
        </div>
        <p className="text-fg font-medium pr-11 whitespace-pre-wrap">
          {user.summary || "خلاصه‌ای ثبت نشده است"}
        </p>
      </div>
    </div>
  );
};

export default SummarySection;
