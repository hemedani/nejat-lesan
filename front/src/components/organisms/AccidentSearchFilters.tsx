"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SearchFiltersProps {
  defaultValues: {
    date_from?: string;
    date_to?: string;
    province_id?: string;
    city_id?: string;
    min_injured?: string;
    min_dead?: string;
    has_witness?: boolean;
    collision_type_id?: string;
    sort_by?: string;
    sort_order?: string;
  };
}

const AccidentSearchFilters: React.FC<SearchFiltersProps> = ({ defaultValues }) => {
  const router = useRouter();
  const [filters, setFilters] = useState({
    date_from: defaultValues.date_from || "",
    date_to: defaultValues.date_to || "",
    province_id: defaultValues.province_id || "",
    city_id: defaultValues.city_id || "",
    min_injured: defaultValues.min_injured || "",
    min_dead: defaultValues.min_dead || "",
    has_witness: defaultValues.has_witness || false,
    collision_type_id: defaultValues.collision_type_id || "",
    sort_by: defaultValues.sort_by || "date_of_accident",
    sort_order: defaultValues.sort_order || "desc"
  });

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    
    setFilters(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    
    // Add all non-empty filters to URL params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== undefined) {
        params.set(key, String(value));
      }
    });
    
    // Reset to page 1 when filtering
    params.set("page", "1");
    
    router.push(`?${params.toString()}`);
  };

  const handleReset = () => {
    setFilters({
      date_from: "",
      date_to: "",
      province_id: "",
      city_id: "",
      min_injured: "",
      min_dead: "",
      has_witness: false,
      collision_type_id: "",
      sort_by: "date_of_accident",
      sort_order: "desc"
    });
    
    router.push("?");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">از تاریخ</label>
          <input
            type="date"
            name="date_from"
            value={filters.date_from}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
          <input
            type="date"
            name="date_to"
            value={filters.date_to}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نوع برخورد</label>
          <select
            name="collision_type_id"
            value={filters.collision_type_id}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">همه</option>
            {/* Placeholder for collision types - would be populated from API */}
            <option value="1">تصادف از جلو</option>
            <option value="2">تصادف از پشت</option>
            <option value="3">تصادف از پهلو</option>
            <option value="4">واژگونی</option>
          </select>
        </div>
      </div>
      
      <div className="mb-4">
        <button 
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
        >
          {isAdvancedOpen ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              بستن فیلترهای پیشرفته
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              فیلترهای پیشرفته
            </>
          )}
        </button>
      </div>
      
      {isAdvancedOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">استان</label>
            <select
              name="province_id"
              value={filters.province_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">همه</option>
              {/* Placeholder for provinces - would be populated from API */}
              <option value="1">تهران</option>
              <option value="2">اصفهان</option>
              <option value="3">مشهد</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">شهر</label>
            <select
              name="city_id"
              value={filters.city_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">همه</option>
              {/* Placeholder for cities - would be populated from API based on selected province */}
              <option value="1">تهران</option>
              <option value="2">کرج</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">حداقل تعداد مجروح</label>
            <input
              type="number"
              name="min_injured"
              value={filters.min_injured}
              onChange={handleChange}
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">حداقل تعداد فوتی</label>
            <input
              type="number"
              name="min_dead"
              value={filters.min_dead}
              onChange={handleChange}
              min="0"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center">
            <label className="inline-flex items-center mt-6">
              <input
                type="checkbox"
                name="has_witness"
                checked={filters.has_witness}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="mr-2 text-gray-700">دارای شاهد</span>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">مرتب‌سازی بر اساس</label>
            <select
              name="sort_by"
              value={filters.sort_by}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date_of_accident">تاریخ تصادف</option>
              <option value="dead_count">تعداد فوتی</option>
              <option value="injured_count">تعداد مجروح</option>
              <option value="serial">شماره سریال</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ترتیب</label>
            <select
              name="sort_order"
              value={filters.sort_order}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">نزولی</option>
              <option value="asc">صعودی</option>
            </select>
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-4 space-x-reverse">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          پاک کردن فیلترها
        </button>
        
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          اعمال فیلترها
        </button>
      </div>
    </form>
  );
};

export default AccidentSearchFilters;