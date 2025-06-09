import { accidentSchema } from "@/types/declarations/selectInp";
import { converDate } from "@/utils/helper";

interface AccidentTableProps {
  accidents: accidentSchema[];
  onView: (accident: accidentSchema) => void;
  onEdit: (accident: accidentSchema) => void;
  onDelete: (accident: accidentSchema) => void;
}

const AccidentTable: React.FC<AccidentTableProps> = ({
  accidents,
  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              شماره سریال
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              تاریخ
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              موقعیت
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              نوع تصادف
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              تلفات
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              مجروحین
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              شاهد
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              عملیات
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {accidents.map((accident) => (
            <tr key={accident._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {accident.serial || "--"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {accident.date_of_accident
                  ? converDate(accident.date_of_accident.toString())
                  : "--"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {accident.province?.name && accident.city?.name
                  ? `${accident.province.name} - ${accident.city.name}`
                  : "--"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {accident.type?.name || "--"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    accident.dead_count > 0
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {accident.dead_count}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    accident.injured_count > 0
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {accident.injured_count}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {accident.has_witness ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    بله
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    خیر
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <button
                    onClick={() => onView(accident)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    مشاهده
                  </button>
                  <button
                    onClick={() => onEdit(accident)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => onDelete(accident)}
                    className="text-red-600 hover:text-red-900"
                  >
                    حذف
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {accidents.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">هیچ تصادفی یافت نشد</p>
        </div>
      )}
    </div>
  );
};

export default AccidentTable;
