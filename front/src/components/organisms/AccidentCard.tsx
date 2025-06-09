import { accidentSchema } from "@/types/declarations/selectInp";
import { converDate } from "@/utils/helper";

interface AccidentCardProps {
  accident: accidentSchema;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AccidentCard: React.FC<AccidentCardProps> = ({
  accident,
  onView,
  onEdit,
  onDelete,
}) => {
  // Calculate severity level based on dead and injured counts
  const getSeverityLevel = () => {
    if (accident.dead_count > 0) return "high";
    if (accident.injured_count > 2) return "medium";
    return "low";
  };

  const severityLevel = getSeverityLevel();
  const severityColors = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    low: "bg-green-100 text-green-800 border-green-200",
  };

  const severityText = {
    high: "شدید",
    medium: "متوسط",
    low: "سبک",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {accident.serial ? `شماره ${accident.serial}` : "تصادف"}
            </h3>
            <p className="text-sm text-gray-500">
              {accident.date_of_accident
                ? converDate(accident.date_of_accident.toString())
                : "تاریخ نامشخص"}
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${severityColors[severityLevel]} border`}
          >
            {severityText[severityLevel]}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-gray-700">
              {accident.province?.name || ""}
              {accident.province?.name && accident.city?.name ? "، " : ""}
              {accident.city?.name || "موقعیت نامشخص"}
            </span>
          </div>

          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span className="text-gray-700">
              {accident.collision_type?.name || "نوع تصادف نامشخص"}
            </span>
          </div>

          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-red-700 font-medium">
                {accident.dead_count}
              </span>
            </div>

            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-amber-500 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
              <span className="text-amber-700 font-medium">
                {accident.injured_count}
              </span>
            </div>

            {accident.has_witness && (
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-500 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span className="text-blue-700 text-sm">شاهد</span>
              </div>
            )}
          </div>

          {accident.vehicle_dtos && accident.vehicle_dtos.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">خودروها:</p>
              <div className="flex flex-wrap gap-2">
                {accident.vehicle_dtos.slice(0, 2).map((vehicle, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md"
                  >
                    {vehicle.system?.name || "نامشخص"}
                  </span>
                ))}
                {accident.vehicle_dtos.length > 2 && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                    +{accident.vehicle_dtos.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between">
          <button
            onClick={onView}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
          >
            مشاهده جزئیات
          </button>

          <div className="flex space-x-3 space-x-reverse">
            <button
              onClick={onEdit}
              className="p-1.5 bg-yellow-100 text-yellow-600 rounded-md hover:bg-yellow-200 transition-colors duration-200"
              title="ویرایش"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>

            <button
              onClick={onDelete}
              className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors duration-200"
              title="حذف"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccidentCard;
