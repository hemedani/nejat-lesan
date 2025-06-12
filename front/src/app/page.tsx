"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { gets as getAccidents } from '@/app/actions/accident/gets';
import AdvancedSearch from '@/components/molecules/AdvancedSearch';
import { DefaultSearchArrayValues } from '@/utils/prepareAccidentSearch';
import { ReqType } from '@/types/declarations/selectInp';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

// Import Leaflet CSS and library
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { array } from 'zod';

// Define accident interface based on the schema
interface AccidentData {
  _id: string;
  seri: number;
  serial?: number;
  location?: {
    coordinates?: [number, number];
  };
  date_of_accident: string;
  dead_count: number;
  injured_count: number;
}

// Fix Leaflet default marker icons
if (typeof window !== 'undefined') {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

export default function HomePage() {
  const [accidents, setAccidents] = useState<AccidentData[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const searchParams = useSearchParams();

  // Initialize empty default search values
  const defaultSearchArrayValues: DefaultSearchArrayValues = {
    areaUsages: [],
    airStatuses: [],
    roadDefects: [],
    humanReasons: [],
    vehicleReasons: [],
    equipmentDamages: [],
    roadSurfaceConditions: [],
    vehicleMaxDamageSections: [],
  };

  // Fetch accidents data
  useEffect(() => {
    const fetchAccidents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build search parameters from URL
        const searchFilters: Record<string, string | string[] | number | Date> = {};

        // Set required pagination fields
        const page = +(searchParams.get('page') || '1');
        const limit = +(searchParams.get('limit') || '1000');

        const arrayKeys = ['areaUsages', 'airStatuses', 'roadDefects', 'humanReasons', 'vehicleReasons', 'equipmentDamages', 'roadSurfaceConditions', 'vehicleMaxDamageSections'];
        // Add other search parameters if they exist
        for (const [key, value] of searchParams.entries()) {
          if (value) {
            if (key.includes('Min') || key.includes('Max') || key === 'seri' || key === 'serial') {
              searchFilters[key] = parseInt(value) || value;
            } else if (key.includes('Date')) {
              searchFilters[key] = new Date(value);
            } else if(arrayKeys.includes(key)) {
              searchFilters[key] = value.split(",");
            } else {
              searchFilters[key] = value;
            }
          }
        }

        const setParams: ReqType["main"]["accident"]["gets"]["set"] = {
          ...searchFilters,
          page,
          limit,
        };

        const response = await getAccidents({
          set: setParams,
          get: {
            _id: 1,
            seri: 1,
            serial: 1,
            location: 1,
            date_of_accident: 1,
            dead_count: 1,
            injured_count: 1,
          },
        });

        if (response.success) {
          setAccidents(response.body);
          setRetryCount(0);
        } else {
          throw new Error('پاسخ نامعتبر از سرور');
        }
      } catch (error) {
        console.error('خطا در بارگذاری داده‌های تصادفات:', error);
        setError('خطا در بارگذاری داده‌های تصادفات. لطفاً دوباره تلاش کنید.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccidents();
  }, [searchParams, retryCount]);

  // Retry function
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Format Persian date
  const formatPersianDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch {
      return 'تاریخ نامشخص';
    }
  };

  // Iran center coordinates
  const iranCenter: [number, number] = [32.4279, 53.6880];

  return (
    <div className="relative w-full h-screen bg-slate-100">
      {/* Map Container with Beautiful Frame */}
      <div className="absolute inset-4 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Map Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 border-b border-slate-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white mb-1">
                نقشه تصادفات کشور
              </h1>
              <p className="text-slate-300 text-sm">
                مشاهده و تحلیل تصادفات بر روی نقشه
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Advanced Search Toggle Button */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                جستجوی پیشرفته
              </button>
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="relative h-full">
          {!loading && (
            <MapContainer
              center={iranCenter}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Render accident markers */}
              {accidents
                .filter(accident =>
                  accident.location?.coordinates &&
                  Array.isArray(accident.location.coordinates) &&
                  accident.location.coordinates.length === 2
                )
                .map((accident) => {
                  const [lng, lat] = accident.location!.coordinates!;
                  return (
                    <Marker
                      key={accident._id}
                      position={[lat, lng]}
                    >
                      <Popup className="text-right">
                        <div className="text-sm space-y-2 min-w-[200px]">
                          <div className="font-bold text-blue-600">
                            سری: {accident.seri}
                          </div>
                          <div>
                            <span className="font-medium">تاریخ تصادف:</span>
                            <br />
                            <span className="text-gray-600">
                              {formatPersianDate(accident.date_of_accident)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="bg-red-50 p-2 rounded">
                              <div className="text-red-600 font-medium text-xs">تعداد فوتی</div>
                              <div className="text-red-800 font-bold">{accident.dead_count}</div>
                            </div>
                            <div className="bg-orange-50 p-2 rounded">
                              <div className="text-orange-600 font-medium text-xs">تعداد مجروح</div>
                              <div className="text-orange-800 font-bold">{accident.injured_count}</div>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
            </MapContainer>
          )}

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 font-medium">در حال بارگذاری نقشه...</p>
                <p className="mt-2 text-sm text-gray-500">
                  {accidents.length > 0 ? `${accidents.length.toLocaleString('fa-IR')} تصادف یافت شد` : 'در حال جستجو...'}
                </p>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && !loading && (
            <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">خطا در بارگذاری</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleRetry}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors duration-200 font-medium"
                >
                  تلاش مجدد
                </button>
              </div>
            </div>
          )}

          {/* No data overlay */}
          {!loading && !error && accidents.length === 0 && (
            <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.513-.751-6.28-2.028.34-.542.775-.990.28-1.972C7.36 10.48 9.592 10 12 10s4.64.48 5.72 1.472c.495.982.06 1.43.28 1.972C16.513 14.249 14.34 15 12 15z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">هیچ تصادفی یافت نشد</h3>
                <p className="text-gray-600 mb-4">با معیارهای جستجوی فعلی، هیچ تصادفی در دیتابیس موجود نیست.</p>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors duration-200 font-medium"
                >
                  تغییر فیلترهای جستجو
                </button>
              </div>
            </div>
          )}

          {/* Statistics Panel */}
          {!loading && !error && accidents.length > 0 && (
            <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-4 min-w-[220px]">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                آمار کلی
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">تعداد تصادفات:</span>
                  <span className="font-bold text-slate-800">{accidents.length.toLocaleString('fa-IR')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">کل فوتی‌ها:</span>
                  <span className="font-bold text-red-600">
                    {accidents.reduce((sum, acc) => sum + acc.dead_count, 0).toLocaleString('fa-IR')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">کل مجروحان:</span>
                  <span className="font-bold text-orange-600">
                    {accidents.reduce((sum, acc) => sum + acc.injured_count, 0).toLocaleString('fa-IR')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">نمایش روی نقشه:</span>
                    <span className="text-emerald-600 font-medium">
                      {accidents.filter(acc => acc.location?.coordinates).length.toLocaleString('fa-IR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Search Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 z-50 border-l border-slate-200 ${
          isSearchOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 border-b border-slate-300">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">جستجوی پیشرفته</h2>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="h-full overflow-y-auto pb-20" style={{ height: 'calc(100% - 73px)' }}>
          <div className="p-2">
            <AdvancedSearch
              isOpen={isSearchOpen}
              defaultSearchArrayValues={defaultSearchArrayValues}
              pageAddress=""
              compact={true}
            />
          </div>
        </div>
      </div>

      {/* Overlay for closing search panel on mobile */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setIsSearchOpen(false)}
        />
      )}
    </div>
  );
}
