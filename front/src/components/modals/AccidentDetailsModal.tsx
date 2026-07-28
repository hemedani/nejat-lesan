"use client";

import React from "react";
import { accidentSchema } from "@/types/declarations/selectInp";
import { useScrollLock } from "@/hooks/useScrollLock";

interface AccidentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: accidentSchema[];
}

const AccidentDetailsModal: React.FC<AccidentDetailsModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  // Prevent background scrolling when modal is open
  useScrollLock(isOpen);

  if (!isOpen) return null;

  // Format time from date
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fa-IR");
  };

  // Calculate vehicle counts from vehicle_dtos
  const getVehicleCount = (
    accident: accidentSchema,
    vehicleTypes: string[],
  ) => {
    return (
      accident.vehicle_dtos?.filter((vehicle) =>
        vehicleTypes.some(
          (type) =>
            vehicle.system_type?.name?.includes(type) ||
            vehicle.system?.name?.includes(type),
        ),
      ).length || 0
    );
  };

  // Get pedestrian count
  const getPedestrianCount = (accident: accidentSchema) => {
    return accident.pedestrian_dtos?.length || 0;
  };

  return (
     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-[95vw] max-w-[1600px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              جزئیات تصادفات در منطقه انتخاب شده
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              تعداد تصادفات: {data.length.toLocaleString("fa-IR")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto px-6 pb-6">
          {data.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">تصادفی در این منطقه یافت نشد.</p>
            </div>
          ) : (
            <table className="w-full border-collapse border border-gray-300 min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50 sticky top-0 z-10">
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      زمان تصادف
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      تاریخ تصادف
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      متوفیان
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      مجروحان
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      نوع برخورد
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      سواری/وانت
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      سنگین مسافری
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      سنگین باری
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      موتورسیکلت
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      دوچرخه
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      عابر پیاده
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      موانع دید
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      نقایص راه
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      روشنایی
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      موقعیت
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                      علت تصادف
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((accident, index) => (
                    <tr
                      key={`${accident._id}-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-gray-900 whitespace-nowrap">
                        {formatTime(accident.date_of_accident)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-gray-900 whitespace-nowrap">
                        {formatDate(accident.date_of_accident)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-center whitespace-nowrap">
                        <span className="text-red-600 font-medium">
                          {accident.dead_count.toLocaleString("fa-IR")}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-center whitespace-nowrap">
                        <span className="text-orange-600 font-medium">
                          {accident.injured_count.toLocaleString("fa-IR")}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-gray-900 whitespace-nowrap">
                        {accident.collision_type?.name || "نامشخص"}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-center text-gray-900 whitespace-nowrap">
                        {getVehicleCount(accident, ["سواری", "وانت", "پیکاپ"])}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-center text-gray-900 whitespace-nowrap">
                        {getVehicleCount(accident, ["اتوبوس", "مینی بوس"])}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-center text-gray-900 whitespace-nowrap">
                        {getVehicleCount(accident, [
                          "کامیون",
                          "تریلی",
                          "کامیونت",
                        ])}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-center text-gray-900 whitespace-nowrap">
                        {getVehicleCount(accident, ["موتورسیکلت", "موتور"])}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-center text-gray-900 whitespace-nowrap">
                        {getVehicleCount(accident, ["دوچرخه", "بایسیکل"])}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-center text-gray-900 whitespace-nowrap">
                        {getPedestrianCount(accident)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-gray-900 whitespace-nowrap">
                        {"ندارد"}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-gray-900 whitespace-nowrap">
                        {accident.road_defects?.[0]?.name || "ندارد"}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-gray-900 whitespace-nowrap">
                        {accident.light_status?.name || "نامشخص"}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-gray-900 whitespace-nowrap">
                        {accident.position?.name || "نامشخص"}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs text-gray-900 whitespace-nowrap">
                        {accident.human_reasons?.[0]?.name || "نامشخص"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              مجموع تصادفات: {data.length.toLocaleString("fa-IR")} | مجموع فوتی:{" "}
              {data
                .reduce((sum, acc) => sum + acc.dead_count, 0)
                .toLocaleString("fa-IR")}{" "}
              | مجموع مجروح:{" "}
              {data
                .reduce((sum, acc) => sum + acc.injured_count, 0)
                .toLocaleString("fa-IR")}
            </div>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccidentDetailsModal;
