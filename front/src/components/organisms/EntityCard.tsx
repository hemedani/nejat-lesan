import { EditIcon, TrashIcon, MapIcon } from "../atoms/Icons";

interface SimpleCardProps {
  title: string;
  onEdit?: () => void; // تابع برای ویرایش (اختیاری)
  onDelete?: () => void; // تابع برای حذف (اختیاری)
  onSeedZones?: () => void; // تابع برای اضافه کردن مناطق شهر (اختیاری)
}

const EntityCard: React.FC<SimpleCardProps> = ({
  title,
  onEdit,
  onDelete,
  onSeedZones,
}) => {
  return (
    <div className="border w-full max-w-sm bg-white rounded-lg shadow-md p-4 flex justify-between items-center">
      <h3 className="text-lg font-semibold text-gray-800 truncate">{title}</h3>
      <div className="flex gap-2">
        {onSeedZones && (
          <button
            onClick={onSeedZones}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-200 shadow"
            title="اضافه کردن مناطق شهر"
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
