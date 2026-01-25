import React from "react";
import { UserFormData } from "./FormCreateUser";
import {
  AccidentSeverityAnalyticFilter,
  AreaUsageAnalyticFilter,
  CollisionAnalyticFilter,
  CompanyPerformanceAnalyticFilter,
  EventCollisionAnalyticFilter,
  EventSeverityAnalyticFilter,
  HourlyDayOfWeekAnalyticFilter,
  HumanReasonAnalyticFilter,
  MonthlyHolidayAnalyticFilter,
  RoadDefectsAnalyticFilter,
  SpatialCollisionAnalyticFilter,
  SpatialLightAnalyticFilter,
  SpatialSafetyIndexAnalyticFilter,
  SpatialSeverityAnalyticFilter,
  SpatialSingleVehicleAnalyticFilter,
  TemporalCollisionAnalyticFilter,
  TemporalCountAnalyticFilter,
  TemporalDamageAnalyticFilter,
  TemporalNightAnalyticFilter,
  TemporalSeverityAnalyticFilter,
  TemporalTotalReasonAnalyticFilter,
  TemporalUnlicensedDriversAnalyticFilter,
  TotalReasonAnalyticFilter,
  VehicleReasonAnalyticFilter,
} from "@/utils/filterConstants";

// Define the exact keys that exist in the availableCharts object
type ChartTypeKeys =
  | "accidentSeverityAnalytics"
  | "areaUsageAnalytics"
  | "collisionAnalytics"
  | "companyPerformanceAnalytics"
  | "eventCollisionAnalytics"
  | "eventSeverityAnalytics"
  | "hourlyDayOfWeekAnalytics"
  | "humanReasonAnalytics"
  | "monthlyHolidayAnalytics"
  | "roadDefectsAnalytics"
  | "spatialCollisionAnalytics"
  | "spatialLightAnalytics"
  | "spatialSafetyIndexAnalytics"
  | "spatialSeverityAnalytics"
  | "spatialSingleVehicleAnalytics"
  | "temporalCollisionAnalytics"
  | "temporalCountAnalytics"
  | "temporalDamageAnalytics"
  | "temporalNightAnalytics"
  | "temporalSeverityAnalytics"
  | "temporalTotalReasonAnalytics"
  | "temporalUnlicensedDriversAnalytics"
  | "totalReasonAnalytics"
  | "vehicleReasonAnalytics";

// Create a mapped type that associates each chart type with its corresponding filter type
type ChartFilterMap = {
  accidentSeverityAnalytics: AccidentSeverityAnalyticFilter;
  areaUsageAnalytics: AreaUsageAnalyticFilter;
  collisionAnalytics: CollisionAnalyticFilter;
  companyPerformanceAnalytics: CompanyPerformanceAnalyticFilter;
  eventCollisionAnalytics: EventCollisionAnalyticFilter;
  eventSeverityAnalytics: EventSeverityAnalyticFilter;
  hourlyDayOfWeekAnalytics: HourlyDayOfWeekAnalyticFilter;
  humanReasonAnalytics: HumanReasonAnalyticFilter;
  monthlyHolidayAnalytics: MonthlyHolidayAnalyticFilter;
  roadDefectsAnalytics: RoadDefectsAnalyticFilter;
  spatialCollisionAnalytics: SpatialCollisionAnalyticFilter;
  spatialLightAnalytics: SpatialLightAnalyticFilter;
  spatialSafetyIndexAnalytics: SpatialSafetyIndexAnalyticFilter;
  spatialSeverityAnalytics: SpatialSeverityAnalyticFilter;
  spatialSingleVehicleAnalytics: SpatialSingleVehicleAnalyticFilter;
  temporalCollisionAnalytics: TemporalCollisionAnalyticFilter;
  temporalCountAnalytics: TemporalCountAnalyticFilter;
  temporalDamageAnalytics: TemporalDamageAnalyticFilter;
  temporalNightAnalytics: TemporalNightAnalyticFilter;
  temporalSeverityAnalytics: TemporalSeverityAnalyticFilter;
  temporalTotalReasonAnalytics: TemporalTotalReasonAnalyticFilter;
  temporalUnlicensedDriversAnalytics: TemporalUnlicensedDriversAnalyticFilter;
  totalReasonAnalytics: TotalReasonAnalyticFilter;
  vehicleReasonAnalytics: VehicleReasonAnalyticFilter;
};

interface ChartStepProps {
  title: string;
  fields: { key: string; label: string }[];
  chartType: ChartTypeKeys; // Restrict chartType to known chart types
  formData: UserFormData;
  handleCheckboxChange: (chartType: ChartTypeKeys, field: string, checked: boolean) => void;
}

const ChartStep: React.FC<ChartStepProps> = ({
  title,
  fields,
  chartType,
  formData,
  handleCheckboxChange,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-700">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((field) => (
          <label key={field.key} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
            <input
              type="checkbox"
              checked={
                !!formData.availableCharts?.[chartType]?.[
                  field.key as keyof ChartFilterMap[typeof chartType]
                ]
              }
              onChange={(e) => handleCheckboxChange(chartType, field.key, e.target.checked)}
              className="rounded text-blue-600"
            />
            <span className="text-sm">{field.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ChartStep;
