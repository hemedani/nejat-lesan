import { EditIcon, TrashIcon, MapIcon, LocationMarkerIcon } from "../atoms/Icons";

interface SimpleCardProps {
  title: string;
  onEdit?: () => void; // تابع برای ویرایش (اختیاری)
  onDelete?: () => void; // تابع برای حذف (اختیاری)
  onSeedZones?: () => void; // تابع برای اضافه کردن مناطق شهر (اختیاری)
  onSeedTownships?: () => void; // تابع برای اضافه کردن شهرستان‌های استان (اختیاری)
  onProvinceRelation?: () => void; // تابع برای مدیریت ارتباط با استان (اختیاری)
  onSeedTrafficZones?: () => void; // تابع برای اضافه کردن مناطق ترافیک و آلودگی هوا (اختیاری)
}

const EntityCard: React.FC<SimpleCardProps> = ({
  title,
  onEdit,
  onDelete,
  onSeedZones,
  onSeedTownships,
  onProvinceRelation,
  onSeedTrafficZones,
}) => {
  return (
    <div className="border border-line w-full bg-surface/75 rounded-xl shadow-xl p-4 flex justify-between items-center hover:border-blue-400/30 transition-colors">
      <h3 className="text-lg font-semibold text-fg truncate">{title}</h3>
      <div className="flex gap-2">
        {onProvinceRelation && (
          <button
            onClick={onProvinceRelation}
            className="p-2 bg-indigo-500 text-on-brand rounded-full hover:bg-indigo-600 transition-all duration-200 shadow"
            title="مدیریت ارتباط با استان"
          >
            <LocationMarkerIcon />
          </button>
        )}
        {onSeedZones && (
          <button
            onClick={onSeedZones}
            className="p-2 bg-brand text-on-brand rounded-full hover:bg-brand-hover transition-all duration-200 shadow"
            title="اضافه کردن مناطق شهر"
          >
            <MapIcon />
          </button>
        )}
        {onSeedTownships && (
          <button
            onClick={onSeedTownships}
            className="p-2 bg-green-500 text-on-brand rounded-full hover:bg-green-600 transition-all duration-200 shadow"
            title="اضافه کردن شهرستان‌های استان"
          >
            <MapIcon />
          </button>
        )}
        {onSeedTrafficZones && (
          <button
            onClick={onSeedTrafficZones}
            className="p-2 bg-purple-500 text-on-brand rounded-full hover:bg-purple-600 transition-all duration-200 shadow"
            title="اضافه کردن مناطق ترافیک و آلودگی هوا"
          >
            <MapIcon />
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 tint-warning bg-tint-strong text-tint-fg rounded-full border border-tint-border hover:bg-tint-soft transition-all duration-200 shadow"
            title="ویرایش"
          >
            <EditIcon />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 bg-red-500 text-on-brand rounded-full hover:bg-red-600 transition-all duration-200 shadow"
            title="حذف"
          >
            <TrashIcon />
          </button>
        )}
      </div>
    </div>
  );
};

export default EntityCard;
