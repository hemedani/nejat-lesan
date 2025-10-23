"use client";

import React, { useState, useEffect } from "react";
import ChartsFilterSidebar, {
  RoadDefectsFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChart } from "@/utils/chartFilters";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { collisionAnalytics } from "@/app/actions/accident/collisionAnalytics";
import CollisionAnalyticsDashboard from "@/components/dashboards/CollisionAnalyticsDashboard";

// Backend response interface for collision analytics
interface CollisionAnalyticsResponse {
  mainChart: Array<{
    name: string;
    count: number;
  }>;
  singleVehicleChart: Array<{
    name: string;
    count: number;
  }>;
  otherTypesChart: Array<{
    name: string;
    count: number;
  }>;
}

// Get enabled filters for collision analytics
const ENABLED_FILTERS = getEnabledFiltersForChart("COLLISION_ANALYTICS");

const CollisionAnalyticsPage = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [collisionData, setCollisionData] =
    useState<CollisionAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<RoadDefectsFilterState>(
    {},
  );

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await collisionAnalytics({
        set: {
          dateOfAccidentFrom: "",
          dateOfAccidentTo: "",
          province: [],
          city: [],
          road: [],
          accidentType: [],
          collisionType: [],
          lightStatus: [],
          roadSituation: [],
          areaUsages: [],
          airStatuses: [],
          roadDefects: [],
          humanReasons: [],
          vehicleReasons: [],
          roadSurfaceConditions: [],
          equipmentDamages: [],
          vehicleColor: [],
          vehicleSystem: [],
          vehiclePlaqueType: [],
          vehicleSystemType: [],
          vehicleFaultStatus: [],
          vehicleInsuranceCo: [],
          vehiclePlaqueUsage: [],
          vehicleBodyInsuranceCo: [],
          vehicleMotionDirection: [],
          vehicleMaxDamageSections: [],
          driverSex: [],
          driverLicenceType: [],
          driverInjuryType: [],
          driverTotalReason: [],
          passengerSex: [],
          passengerInjuryType: [],
          passengerFaultStatus: [],
          passengerTotalReason: [],
          pedestrianSex: [],
          pedestrianInjuryType: [],
          pedestrianFaultStatus: [],
          pedestrianTotalReason: [],
        },
        get: {
          mainChart: 1,
          singleVehicleChart: 1,
          otherTypesChart: 1,
        },
      });

      if (result.success) {
        setCollisionData(result.body);
      } else {
        setError(result.error || "خطا در بارگذاری داده‌های تحلیل برخورد");
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter submission
  const handleApplyFilters = async (filters: RoadDefectsFilterState) => {
    setAppliedFilters(filters);
    setIsLoading(true);
    setError(null);
    setCollisionData(null);

    try {
      const result = await collisionAnalytics({
        set: {
          ...filters,
          dateOfAccidentFrom: filters.dateOfAccidentFrom || "",
          dateOfAccidentTo: filters.dateOfAccidentTo || "",
          province: filters.province || [],
          city: filters.city || [],
          road: filters.road || [],
          accidentType: filters.accidentType || [],
          collisionType: filters.collisionType || [],
          lightStatus: filters.lightStatus || [],
          roadSituation: filters.roadSituation || [],
          areaUsages: filters.areaUsages || [],
          airStatuses: filters.airStatuses || [],
          roadDefects: filters.roadDefects || [],
          humanReasons: filters.humanReasons || [],
          vehicleReasons: filters.vehicleReasons || [],
          roadSurfaceConditions: filters.roadSurfaceConditions || [],
          equipmentDamages: filters.equipmentDamages || [],
          vehicleColor: filters.vehicleColor || [],
          vehicleSystem: filters.vehicleSystem || [],
          vehiclePlaqueType: filters.vehiclePlaqueType || [],
          vehicleSystemType: filters.vehicleSystemType || [],
          vehicleFaultStatus: filters.vehicleFaultStatus || [],
          vehicleInsuranceCo: filters.vehicleInsuranceCo || [],
          vehiclePlaqueUsage: filters.vehiclePlaqueUsage || [],
          vehicleBodyInsuranceCo: filters.vehicleBodyInsuranceCo || [],
          vehicleMotionDirection: filters.vehicleMotionDirection || [],
          vehicleMaxDamageSections: filters.vehicleMaxDamageSections || [],
          driverSex: filters.driverSex || [],
          driverLicenceType: filters.driverLicenceType || [],
          driverInjuryType: filters.driverInjuryType || [],
          driverTotalReason: filters.driverTotalReason || [],
          passengerSex: filters.passengerSex || [],
          passengerInjuryType: filters.passengerInjuryType || [],
          passengerFaultStatus: filters.passengerFaultStatus || [],
          passengerTotalReason: filters.passengerTotalReason || [],
          pedestrianSex: filters.pedestrianSex || [],
          pedestrianInjuryType: filters.pedestrianInjuryType || [],
          pedestrianFaultStatus: filters.pedestrianFaultStatus || [],
          pedestrianTotalReason: filters.pedestrianTotalReason || [],
        },
        get: {
          mainChart: 1,
          singleVehicleChart: 1,
          otherTypesChart: 1,
        },
      });

      if (result.success) {
        setCollisionData(result.body);
      } else {
        setError(result.error || "خطا در بارگذاری داده‌های تحلیل برخورد");
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual data loading
  const handleLoadData = async () => {
    await loadInitialData();
  };

  // Filter configuration
  const getFilterConfig = () => {
    return {
      disableSeverityFilter: false,
      disableCollisionTypeFilter: false,
      disableLightingFilter: false,
      lockToSevereAccidents: false,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <ChartNavigation currentSection="overall" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              title="فیلترهای تحلیل برخورد"
              description="برای مشاهده تحلیل دقیق انواع برخورد، فیلترهای مورد نظر را اعمال کنید"
              enabledFilters={ENABLED_FILTERS}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  تحلیل انواع برخورد
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل جامع انواع برخورد، تصادفات تک وسیله‌ای و سایر رویدادهای
                  تصادف
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLoadData}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  )}
                  {isLoading ? "در حال بارگذاری..." : "بارگذاری مجدد"}
                </button>
                <button
                  onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
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
                      strokeWidth="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                    />
                  </svg>
                  {showFilterSidebar ? "مخفی کردن فیلتر" : "نمایش فیلتر"}
                </button>
              </div>
            </div>
          </div>

          {/* Applied Filters Display */}
          <div className="mb-6">
            <AppliedFiltersDisplay filters={appliedFilters} />
          </div>

          {/* Status Messages */}
          <div className="space-y-4">
            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="font-medium text-red-800">خطا</h3>
                </div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {collisionData && !isLoading && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="font-medium text-green-800">
                    داده‌ها بارگذاری شد
                  </h3>
                </div>
                <p className="text-sm text-green-700">
                  تحلیل انواع برخورد با {collisionData.mainChart.length} نوع
                  اصلی، {collisionData.singleVehicleChart.length} نوع تک
                  وسیله‌ای و {collisionData.otherTypesChart.length} نوع دیگر
                </p>
              </div>
            )}

            {/* Collision Analytics Dashboard */}
            <CollisionAnalyticsDashboard
              data={collisionData}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollisionAnalyticsPage;
