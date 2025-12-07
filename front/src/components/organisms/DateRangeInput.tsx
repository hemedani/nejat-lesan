import { useState } from "react";

interface DateRange {
  start: string;
  end: string;
}

interface DateRangeInputProps {
  initialRanges: DateRange[];
  onChange: (ranges: DateRange[]) => void;
}

const DateRangeInput: React.FC<DateRangeInputProps> = ({
  initialRanges,
  onChange,
}) => {
  const [ranges, setRanges] = useState<DateRange[]>(initialRanges);

  const addRange = () => {
    const newRanges = [...ranges, { start: "", end: "" }];
    setRanges(newRanges);
    onChange(newRanges);
  };

  const removeRange = (index: number) => {
    if (ranges.length > 1) {
      const newRanges = [...ranges];
      newRanges.splice(index, 1);
      setRanges(newRanges);
      onChange(newRanges);
    }
  };

  const updateRange = (
    index: number,
    field: keyof DateRange,
    value: string,
  ) => {
    const newRanges = [...ranges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    setRanges(newRanges);
    onChange(newRanges);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-700">بازه‌های تاریخی</h3>
        <button
          type="button"
          onClick={addRange}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          + افزودن بازه جدید
        </button>
      </div>

      {ranges.map((range, index) => (
        <div key={index} className="flex items-end space-x-2 space-x-reverse">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
              تاریخ شروع {index + 1}
            </label>
            <input
              type="date"
              value={range.start}
              onChange={(e) => updateRange(index, "start", e.target.value)}
              className="w-full px-4 py-3 text-slate-800 bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 text-right transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500 hover:border-slate-400"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1 text-right">
              تاریخ پایان {index + 1}
            </label>
            <input
              type="date"
              value={range.end}
              onChange={(e) => updateRange(index, "end", e.target.value)}
              min={range.start || undefined} // Ensure end date is not before start date
              className="w-full px-4 py-3 text-slate-800 bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 text-right transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500 hover:border-slate-400"
            />
          </div>

          {ranges.length > 1 && (
            <button
              type="button"
              onClick={() => removeRange(index)}
              className="p-2 text-red-500 hover:text-red-700 self-end mb-2.5"
              title="حذف بازه"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default DateRangeInput;
