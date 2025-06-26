"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { gets as getAccidents } from '@/app/actions/accident/gets';
import AdvancedSearch from '@/components/molecules/AdvancedSearch';
import { DefaultSearchArrayValues } from '@/utils/prepareAccidentSearch';
import { ReqType } from '@/types/declarations/selectInp';
import { arrayKeys } from "@/utils/keys";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const Polygon = dynamic(() => import('react-leaflet').then((mod) => mod.Polygon), { ssr: false });

// Import SimpleDrawing component
const SimpleDrawing = dynamic(() => import('@/components/SimpleDrawing'), { ssr: false });

// Leaflet will be imported dynamically to avoid SSR issues

// Define accident interface based on the schema
interface AccidentData {
  _id: string;
  location: { type: string, coordinates: number[] };
  date_of_accident: string;
  dead_count: number;
  injured_count: number;
  seri: string;
}

// Leaflet setup will be done dynamically in useEffect

export default function HomePage() {
  const [accidents, setAccidents] = useState<AccidentData[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isPolygonSearchMode, setIsPolygonSearchMode] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<any[] | null>(null);


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
    province: [],
    city: [],
    road: [],
    trafficZone: [],
    cityZone: [],
    accidentType: [],
    position: [],
    rulingType: [],
    lightStatus: [],
    collisionType: [],
    roadSituation: [],
    roadRepairType: [],
    shoulderStatus: [],
    vehicleColor: [],
    vehicleSystem: [],
    vehiclePlaqueType: [],
    vehicleSystemType: [],
    vehicleFaultStatus: [],
    vehicleInsuranceCo: [],
    vehiclePlaqueUsage: [],
    vehicleBodyInsuranceCo: [],
    vehicleMotionDirection: [],
    driverLicenceType: [],
    passengerFaultStatus: [],
    pedestrianFaultStatus: [],
  };

  // Fetch accidents data function
  const fetchAccidents = useCallback(async (polygon?: { type: "Polygon"; coordinates: any[] }) => {
    try {
      setLoading(true);
      setError(null);

      // Build search parameters from URL
      const searchFilters: Record<string, string | string[] | number | Date> = {};

      // Set required pagination fields
      const page = +(searchParams.get('page') || '1');
      const limit = +(searchParams.get('limit') || '1000');

      // Add other search parameters if they exist
      for (const [key, value] of searchParams.entries()) {
        if (value) {
          if (key.includes('Min') || key.includes('Max') || key === 'seri' || key === 'serial') {
            searchFilters[key] = parseInt(value) || value;
          } else if (key.includes('Date')) {
            searchFilters[key] = new Date(value);
          } else if (arrayKeys.includes(key)) {
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
        ...(polygon && { polygon }),
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
  }, [searchParams]);

  // Fetch accidents data on mount and search params change
  useEffect(() => {
    fetchAccidents();
  }, [fetchAccidents, retryCount]);

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

  // Function to check if a point is inside a polygon


  // Clear polygon search
  const clearPolygonSearch = useCallback(() => {
    setDrawnPolygon(null);
    setIsPolygonSearchMode(false);
    // Fetch accidents without polygon filter
    fetchAccidents();
  }, [fetchAccidents]);

  // Toggle polygon search mode
  const togglePolygonSearchMode = () => {
    if (isPolygonSearchMode) {
      clearPolygonSearch();
    } else {
      setIsPolygonSearchMode(true);
    }
  };

  const handlePolygonCreated = useCallback((polygon: any[]) => {
    setDrawnPolygon(polygon);

    // Convert polygon coordinates to GeoJSON format for backend
    // GeoJSON polygons must be closed loops (first coordinate = last coordinate)
    const coordinates = polygon.map(point => [point.lng, point.lat]);
    coordinates.push(coordinates[0]); // Close the polygon loop

    const geoJsonPolygon = {
      type: "Polygon" as const,
      coordinates: [coordinates]
    };

    // Fetch accidents with polygon filter
    fetchAccidents(geoJsonPolygon);
  }, [fetchAccidents]);

  const handlePolygonDeleted = useCallback(() => {
    setDrawnPolygon(null);
    // Fetch accidents without polygon filter
    fetchAccidents();
  }, [fetchAccidents]);

  // Dynamic Leaflet setup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Import CSS dynamically
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCSS);

    const leafletDrawCSS = document.createElement('link');
    leafletDrawCSS.rel = 'stylesheet';
    leafletDrawCSS.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
    document.head.appendChild(leafletDrawCSS);

    // Import Leaflet and fix icons
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
    });

    return () => {
      // Cleanup CSS if needed
      document.head.removeChild(leafletCSS);
      document.head.removeChild(leafletDrawCSS);
    };
  }, []);



  return (
    <div className="relative w-full h-[calc(100vh-6rem)]">
      {/* Map Container with Beautiful Frame */}
      <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
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
              {/* Polygon Search Toggle Button */}
              <button
                onClick={togglePolygonSearchMode}
                className={`${isPolygonSearchMode
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-purple-600 hover:bg-purple-700'
                  } text-white px-6 py-2.5 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 font-medium`}
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
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 5.447-2.724A1 1 0 0121 3.382v10.764a1 1 0 01-.553.894L15 18l-6-3z"
                  />
                </svg>
                {isPolygonSearchMode ? 'لغو (کلیک: نقطه، راست‌کلیک: تمام)' : 'جستجوی چندضلعی'}
              </button>

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
          {/* Polygon Mode Notification Banner */}
          {isPolygonSearchMode && (
            <div className="absolute top-4 right-4 z-30 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg border border-purple-500 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="font-medium text-sm">حالت رسم چندضلعی فعال</span>
              </div>
              <div className="text-xs opacity-90">
                کلیک: افزودن نقطه | راست‌کلیک: تمام | ESC: لغو
              </div>
            </div>
          )}

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

              <SimpleDrawing
                isActive={isPolygonSearchMode}
                onPolygonCreated={handlePolygonCreated}
                onPolygonDeleted={handlePolygonDeleted}
              />

              {/* Render drawn polygon */}
              {drawnPolygon && (
                <Polygon
                  positions={drawnPolygon.map((point: any) => [point.lat, point.lng])}
                  pathOptions={{
                    color: '#3b82f6',
                    weight: 3,
                    opacity: 0.8,
                    fillOpacity: 0.1,
                    fillColor: '#3b82f6'
                  }}
                />
              )}

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
                <div className={`w-3 h-3 ${drawnPolygon ? 'bg-purple-600' : 'bg-blue-600'} rounded-full`}></div>
                {drawnPolygon ? 'آمار منطقه انتخابی' : 'آمار کلی'}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">تعداد تصادفات:</span>
                  <span className="font-bold text-slate-800">
                    {accidents.length.toLocaleString('fa-IR')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">کل فوتی‌ها:</span>
                  <span className="font-bold text-red-600">
                    {accidents.reduce((sum: number, acc: AccidentData) => sum + acc.dead_count, 0).toLocaleString('fa-IR')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">کل مجروحان:</span>
                  <span className="font-bold text-orange-600">
                    {accidents.reduce((sum: number, acc: AccidentData) => sum + acc.injured_count, 0).toLocaleString('fa-IR')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">نمایش روی نقشه:</span>
                    <span className="text-emerald-600 font-medium">
                      {accidents.filter((acc: AccidentData) => acc.location?.coordinates).length.toLocaleString('fa-IR')}
                    </span>
                  </div>
                </div>
                {drawnPolygon && (
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      onClick={clearPolygonSearch}
                      className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      پاک کردن انتخاب
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Advanced Search Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 z-50 border-l border-slate-200 ${isSearchOpen ? 'translate-x-0' : 'translate-x-full'
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
