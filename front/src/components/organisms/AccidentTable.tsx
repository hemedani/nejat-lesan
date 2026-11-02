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
      <table className="min-w-full divide-y divide-line">
        <thead className="bg-canvas">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-fg-muted uppercase tracking-wider"
            >
              شماره سریال
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-fg-muted uppercase tracking-wider"
            >
              تاریخ
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-fg-muted uppercase tracking-wider"
            >
              موقعیت
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-fg-muted uppercase tracking-wider"
            >
              نوع تصادف
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-fg-muted uppercase tracking-wider"
            >
              تلفات
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-fg-muted uppercase tracking-wider"
            >
              مجروحین
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-fg-muted uppercase tracking-wider"
            >
              شاهد
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-fg-muted uppercase tracking-wider"
            >
              عملیات
            </th>
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-line">
          {accidents.map((accident) => (
            <tr key={accident._id} className="hover:bg-surface-hover">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-fg">
                {accident.serial || "--"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-fg-muted">
                {accident.date_of_accident
                  ? converDate(accident.date_of_accident.toString())
                  : "--"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-fg-muted">
                {accident.province?.name && accident.city?.name
                  ? `${accident.province.name} - ${accident.city.name}`
                  : "--"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-fg-muted">
                {accident.type?.name || "--"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-fg-muted">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    accident.dead_count > 0
                      ? "bg-danger-soft text-danger-fg"
                      : "bg-surface-sunken text-fg"
                  }`}
                >
                  {accident.dead_count}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-fg-muted">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    accident.injured_count > 0
                      ? "tint-warning bg-tint-strong text-tint-fg"
                      : "bg-surface-sunken text-fg"
                  }`}
                >
                  {accident.injured_count}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-fg-muted">
                {accident.has_witness ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-soft text-success-fg">
                    بله
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-surface-sunken text-fg">
                    خیر
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <button
                    onClick={() => onView(accident)}
                    className="text-tint-fg hover:text-indigo-900"
                  >
                    مشاهده
                  </button>
                  <button
                    onClick={() => onEdit(accident)}
                    className="text-brand-fg hover:text-blue-900"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => onDelete(accident)}
                    className="text-danger-fg hover:text-red-900"
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
          <p className="text-fg-muted">هیچ تصادفی یافت نشد</p>
        </div>
      )}
    </div>
  );
};

export default AccidentTable;
