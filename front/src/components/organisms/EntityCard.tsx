import { EditIcon, TrashIcon, MapIcon, LocationMarkerIcon } from "../atoms/Icons";

interface SimpleCardProps {
  title: string;
  onEdit?: () => void; // تابع برای ویرایش (اختیاری)
  onDelete?: () => void; // تابع برای حذف (اختیاری)
  onSeedZones?: () => void; // تابع برای اضافه کردن مناطق شهر (اختیاری)
  onSeedTownships?: () => void; // تابع برای اضافه کردن شهرستان‌های استان (اختیاری)
  onProvinceRelation?: () => void; // تابع برای مدیریت ارتباط با استان (اختیاری)
}

const EntityCard: React.FC<SimpleCardProps> = ({
  title,
  onEdit,
  onDelete,
  onSeedZones,
  onSeedTownships,
  onProvinceRelation,
}) => {
  return (
    <div className="border w-full max-w-sm bg-white rounded-lg shadow-md p-4 flex justify-between items-center">
      <h3 className="text-lg font-semibold text-gray-800 truncate">{title}</h3>
      <div className="flex gap-2">
        {onProvinceRelation && (
          <button
            onClick={onProvinceRelation}
            className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-all duration-200 shadow"
            title="مدیریت ارتباط با استان"
          >
            <LocationMarkerIcon />
          </button>
        )}
        {onSeedZones && (
          <button
            onClick={onSeedZones}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-200 shadow"
            title="اضافه کردن مناطق شهر"
          >
            <MapIcon />
          </button>
        )}
        {onSeedTownships && (
          <button
            onClick={onSeedTownships}
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all duration-200 shadow"
            title="اضافه کردن شهرستان‌های استان"
          >
            <MapIcon />
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 bg-yellow-400 text-white rounded-full hover:bg-yellow-500 transition-all duration-200 shadow"
            title="ویرایش"
          >
            <EditIcon />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow"
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
