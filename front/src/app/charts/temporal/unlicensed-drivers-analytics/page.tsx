"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import ChartsFilterSidebar, { ChartFilterState } from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChartWithPermissions } from "@/utils/chartFilters";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import { temporalUnlicensedDriversAnalytics } from "@/app/actions/accident/temporalUnlicensedDriversAnalytics";
import { ReqType } from "@/types/declarations/selectInp";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Types for the API response
interface ChartSeries {
  name: string;
  data: number[];
}

interface TemporalUnlicensedDriversData {
  categories: string[];
  series: ChartSeries[];
}

interface TemporalUnlicensedDriversResponse {
  body: {
    analytics: TemporalUnlicensedDriversData;
  };
  success: boolean;
}

// Chart component
interface TemporalUnlicensedDriversChartProps {
  data: TemporalUnlicensedDriversData | null;
  isLoading: boolean;
}

const TemporalUnlicensedDriversChart: React.FC<TemporalUnlicensedDriversChartProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.series || data.series.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-600">هیچ داده‌ای برای نمایش وجود ندارد</p>
            <p className="text-sm text-gray-500 mt-1">لطفاً فیلترهای مناسب را انتخاب کنید</p>
          </div>
        </div>
      </div>
    );
  }

  const chartOptions = {
    chart: {
      type: "line" as const,
      height: 400,
      fontFamily: "inherit",
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    title: {
      text: "مقایسه زمانی کاربران فاقد گواهینامه معتبر",
      align: "center" as const,
      style: {
        fontSize: "18px",
        fontWeight: "600",
        color: "#1f2937",
      },
    },
    xaxis: {
      categories: data.categories,
      title: {
        text: "دوره زمانی",
        style: {
          fontSize: "14px",
          fontWeight: "500",
          color: "#6b7280",
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: "#6b7280",
        },
      },
    },
    yaxis: {
      title: {
        text: "تعداد تصادفات",
        style: {
          fontSize: "14px",
          fontWeight: "500",
          color: "#6b7280",
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: "#6b7280",
        },
      },
    },
    stroke: {
      curve: "smooth" as const,
      width: 3,
    },
    colors: ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"],
    grid: {
      show: true,
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
    },
    tooltip: {
      theme: "light",
      style: {
        fontSize: "12px",
      },
      y: {
        formatter: function (val: number) {
          return val + " تصادف";
        },
      },
    },
    legend: {
      position: "top" as const,
      horizontalAlign: "center" as const,
      fontSize: "14px",
      fontWeight: 500,
      markers: {
        size: 12,
        strokeWidth: 0,
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: "bottom" as const,
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <Chart options={chartOptions} series={data.series} type="line" height={400} />
    </div>
  );
};

// Main page component
const TemporalUnlicensedDriversAnalyticsPage = () => {
  const { enterpriseSettings, userLevel } = useAuth();

  // Get enabled filters for temporal unlicensed drivers analytics considering enterprise settings
  const ENABLED_FILTERS = useMemo(
    () =>
      getEnabledFiltersForChartWithPermissions(
        "TEMPORAL_UNLICENSED_DRIVERS_ANALYTICS",
        userLevel === "Enterprise" ? enterpriseSettings : undefined,
      ),
    [enterpriseSettings, userLevel],
  );

  const getDefaultFilters = (): ChartFilterState => {
    return {
      // --- Core Accident Details ---
      seri: undefined,
      serial: undefined,
      dateOfAccidentFrom: undefined,
      dateOfAccidentTo: undefined,
      deadCount: undefined,
      deadCountMin: undefined,
      deadCountMax: undefined,
      injuredCount: undefined,
      injuredCountMin: undefined,
      injuredCountMax: undefined,
      hasWitness: undefined,
      newsNumber: undefined,
      officer: undefined,
      completionDateFrom: undefined,
      completionDateTo: undefined,

      // --- Location & Context (multi-select) ---
      province: [],
      city: [],
      road: [],
      trafficZone: [],
      cityZone: [],
      accidentType: [],
      position: [],
      rulingType: [],

      // --- Environmental & Reason-based (multi-select) ---
      lightStatus: [],
      collisionType: [],
      roadSituation: [],
      roadRepairType: [],
      shoulderStatus: [],
      areaUsages: [],
      airStatuses: [],
      roadDefects: [],
      humanReasons: [],
      vehicleReasons: [],
      equipmentDamages: [],
      roadSurfaceConditions: [],

      // --- Attachments ---
      attachmentName: undefined,
      attachmentType: undefined,

      // --- Vehicle DTOs Filters ---
      vehicleColor: [],
      vehicleSystem: [],
      vehiclePlaqueType: [],
      vehicleSystemType: [],
      vehicleFaultStatus: [],
      vehicleInsuranceCo: [],
      vehicleInsuranceNo: undefined,
      vehiclePlaqueUsage: [],
      vehiclePrintNumber: undefined,
      vehiclePlaqueSerialElement: undefined,
      vehicleInsuranceDateFrom: undefined,
      vehicleInsuranceDateTo: undefined,
      vehicleBodyInsuranceCo: [],
      vehicleBodyInsuranceNo: undefined,
      vehicleMotionDirection: [],
      vehicleMaxDamageSections: [],
      vehicleDamageSectionOther: undefined,
      vehicleInsuranceWarrantyLimit: undefined,
      vehicleInsuranceWarrantyLimitMin: undefined,
      vehicleInsuranceWarrantyLimitMax: undefined,

      // --- Driver in Vehicle DTOs Filters ---
      driverSex: [],
      driverFirstName: undefined,
      driverLastName: undefined,
      driverNationalCode: undefined,
      driverLicenceNumber: undefined,
      driverLicenceType: [],
      driverInjuryType: [],
      driverTotalReason: [],

      // --- Passenger in Vehicle DTOs Filters ---
      passengerSex: [],
      passengerFirstName: undefined,
      passengerLastName: undefined,
      passengerNationalCode: undefined,
      passengerInjuryType: [],
      passengerFaultStatus: [],
      passengerTotalReason: [],

      // --- Pedestrian DTOs Filters ---
      pedestrianSex: [],
      pedestrianFirstName: undefined,
      pedestrianLastName: undefined,
      pedestrianNationalCode: undefined,
      pedestrianInjuryType: [],
      pedestrianFaultStatus: [],
      pedestrianTotalReason: [],
    };
  };

  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<TemporalUnlicensedDriversData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<ChartFilterState>(getDefaultFilters());

  // Load initial data on component mount
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setChartData(null);

    try {
      const defaultFilters = getDefaultFilters();

      // Build the initial payload dynamically with only enabled filters
      const initialFilterPayload: Partial<
        ReqType["main"]["accident"]["temporalUnlicensedDriversAnalytics"]["set"]
      > = {};

      // Helper function to check if a filter should be included
      const includeFilter = (filterName: keyof ChartFilterState) => {
        return ENABLED_FILTERS.includes(filterName);
      };

      // --- Core Accident Details ---
      if (includeFilter("seri") && defaultFilters.seri !== undefined)
        initialFilterPayload.seri = defaultFilters.seri;
      if (includeFilter("serial") && defaultFilters.serial !== undefined)
        initialFilterPayload.serial = defaultFilters.serial;
      if (includeFilter("dateOfAccidentFrom") && defaultFilters.dateOfAccidentFrom !== undefined)
        initialFilterPayload.dateOfAccidentFrom = defaultFilters.dateOfAccidentFrom;
      if (includeFilter("dateOfAccidentTo") && defaultFilters.dateOfAccidentTo !== undefined)
        initialFilterPayload.dateOfAccidentTo = defaultFilters.dateOfAccidentTo;
      if (includeFilter("deadCount") && defaultFilters.deadCount !== undefined)
        initialFilterPayload.deadCount = defaultFilters.deadCount;
      if (includeFilter("deadCountMin") && defaultFilters.deadCountMin !== undefined)
        initialFilterPayload.deadCountMin = defaultFilters.deadCountMin;
      if (includeFilter("deadCountMax") && defaultFilters.deadCountMax !== undefined)
        initialFilterPayload.deadCountMax = defaultFilters.deadCountMax;
      if (includeFilter("injuredCount") && defaultFilters.injuredCount !== undefined)
        initialFilterPayload.injuredCount = defaultFilters.injuredCount;
      if (includeFilter("injuredCountMin") && defaultFilters.injuredCountMin !== undefined)
        initialFilterPayload.injuredCountMin = defaultFilters.injuredCountMin;
      if (includeFilter("injuredCountMax") && defaultFilters.injuredCountMax !== undefined)
        initialFilterPayload.injuredCountMax = defaultFilters.injuredCountMax;
      if (includeFilter("hasWitness") && defaultFilters.hasWitness !== undefined)
        initialFilterPayload.hasWitness = defaultFilters.hasWitness;
      if (includeFilter("newsNumber") && defaultFilters.newsNumber !== undefined)
        initialFilterPayload.newsNumber = defaultFilters.newsNumber;
      if (includeFilter("officer") && defaultFilters.officer !== undefined)
        initialFilterPayload.officer = defaultFilters.officer;
      if (includeFilter("completionDateFrom") && defaultFilters.completionDateFrom !== undefined)
        initialFilterPayload.completionDateFrom = defaultFilters.completionDateFrom;
      if (includeFilter("completionDateTo") && defaultFilters.completionDateTo !== undefined)
        initialFilterPayload.completionDateTo = defaultFilters.completionDateTo;

      // --- Location & Context (multi-select) ---
      if (includeFilter("province") && defaultFilters.province !== undefined)
        initialFilterPayload.province = defaultFilters.province;
      if (includeFilter("city") && defaultFilters.city !== undefined)
        initialFilterPayload.city = defaultFilters.city;
      if (includeFilter("road") && defaultFilters.road !== undefined)
        initialFilterPayload.road = defaultFilters.road;
      if (includeFilter("trafficZone") && defaultFilters.trafficZone !== undefined)
        initialFilterPayload.trafficZone = defaultFilters.trafficZone;
      if (includeFilter("cityZone") && defaultFilters.cityZone !== undefined)
        initialFilterPayload.cityZone = defaultFilters.cityZone;
      if (includeFilter("accidentType") && defaultFilters.accidentType !== undefined)
        initialFilterPayload.accidentType = defaultFilters.accidentType;
      if (includeFilter("position") && defaultFilters.position !== undefined)
        initialFilterPayload.position = defaultFilters.position;
      if (includeFilter("rulingType") && defaultFilters.rulingType !== undefined)
        initialFilterPayload.rulingType = defaultFilters.rulingType;

      // --- Environmental & Reason-based (multi-select) ---
      if (includeFilter("lightStatus") && defaultFilters.lightStatus !== undefined)
        initialFilterPayload.lightStatus = defaultFilters.lightStatus;
      if (includeFilter("collisionType") && defaultFilters.collisionType !== undefined)
        initialFilterPayload.collisionType = defaultFilters.collisionType;
      if (includeFilter("roadSituation") && defaultFilters.roadSituation !== undefined)
        initialFilterPayload.roadSituation = defaultFilters.roadSituation;
      if (includeFilter("roadRepairType") && defaultFilters.roadRepairType !== undefined)
        initialFilterPayload.roadRepairType = defaultFilters.roadRepairType;
      if (includeFilter("shoulderStatus") && defaultFilters.shoulderStatus !== undefined)
        initialFilterPayload.shoulderStatus = defaultFilters.shoulderStatus;
      if (includeFilter("areaUsages") && defaultFilters.areaUsages !== undefined)
        initialFilterPayload.areaUsages = defaultFilters.areaUsages;
      if (includeFilter("airStatuses") && defaultFilters.airStatuses !== undefined)
        initialFilterPayload.airStatuses = defaultFilters.airStatuses;
      if (includeFilter("roadDefects") && defaultFilters.roadDefects !== undefined)
        initialFilterPayload.roadDefects = defaultFilters.roadDefects;
      if (includeFilter("humanReasons") && defaultFilters.humanReasons !== undefined)
        initialFilterPayload.humanReasons = defaultFilters.humanReasons;
      if (includeFilter("vehicleReasons") && defaultFilters.vehicleReasons !== undefined)
        initialFilterPayload.vehicleReasons = defaultFilters.vehicleReasons;
      if (includeFilter("equipmentDamages") && defaultFilters.equipmentDamages !== undefined)
        initialFilterPayload.equipmentDamages = defaultFilters.equipmentDamages;
      if (includeFilter("roadSurfaceConditions") && defaultFilters.roadSurfaceConditions !== undefined)
        initialFilterPayload.roadSurfaceConditions = defaultFilters.roadSurfaceConditions;

      // --- Attachments ---
      if (includeFilter("attachmentName") && defaultFilters.attachmentName !== undefined)
        initialFilterPayload.attachmentName = defaultFilters.attachmentName;
      if (includeFilter("attachmentType") && defaultFilters.attachmentType !== undefined)
        initialFilterPayload.attachmentType = defaultFilters.attachmentType;

      // --- Vehicle DTOs Filters ---
      if (includeFilter("vehicleColor") && defaultFilters.vehicleColor !== undefined)
        initialFilterPayload.vehicleColor = defaultFilters.vehicleColor;
      if (includeFilter("vehicleSystem") && defaultFilters.vehicleSystem !== undefined)
        initialFilterPayload.vehicleSystem = defaultFilters.vehicleSystem;
      if (includeFilter("vehiclePlaqueType") && defaultFilters.vehiclePlaqueType !== undefined)
        initialFilterPayload.vehiclePlaqueType = defaultFilters.vehiclePlaqueType;
      if (includeFilter("vehicleSystemType") && defaultFilters.vehicleSystemType !== undefined)
        initialFilterPayload.vehicleSystemType = defaultFilters.vehicleSystemType;
      if (includeFilter("vehicleFaultStatus") && defaultFilters.vehicleFaultStatus !== undefined)
        initialFilterPayload.vehicleFaultStatus = defaultFilters.vehicleFaultStatus;
      if (includeFilter("vehicleInsuranceCo") && defaultFilters.vehicleInsuranceCo !== undefined)
        initialFilterPayload.vehicleInsuranceCo = defaultFilters.vehicleInsuranceCo;
      if (includeFilter("vehicleInsuranceNo") && defaultFilters.vehicleInsuranceNo !== undefined)
        initialFilterPayload.vehicleInsuranceNo = defaultFilters.vehicleInsuranceNo;
      if (includeFilter("vehiclePlaqueUsage") && defaultFilters.vehiclePlaqueUsage !== undefined)
        initialFilterPayload.vehiclePlaqueUsage = defaultFilters.vehiclePlaqueUsage;
      if (includeFilter("vehiclePrintNumber") && defaultFilters.vehiclePrintNumber !== undefined)
        initialFilterPayload.vehiclePrintNumber = defaultFilters.vehiclePrintNumber;
      if (
        includeFilter("vehiclePlaqueSerialElement") &&
        defaultFilters.vehiclePlaqueSerialElement !== undefined
      )
        initialFilterPayload.vehiclePlaqueSerialElement = defaultFilters.vehiclePlaqueSerialElement;
      if (
        includeFilter("vehicleInsuranceDateFrom") &&
        defaultFilters.vehicleInsuranceDateFrom !== undefined
      )
        initialFilterPayload.vehicleInsuranceDateFrom = defaultFilters.vehicleInsuranceDateFrom;
      if (
        includeFilter("vehicleInsuranceDateTo") &&
        defaultFilters.vehicleInsuranceDateTo !== undefined
      )
        initialFilterPayload.vehicleInsuranceDateTo = defaultFilters.vehicleInsuranceDateTo;
      if (
        includeFilter("vehicleBodyInsuranceCo") &&
        defaultFilters.vehicleBodyInsuranceCo !== undefined
      )
        initialFilterPayload.vehicleBodyInsuranceCo = defaultFilters.vehicleBodyInsuranceCo;
      if (
        includeFilter("vehicleBodyInsuranceNo") &&
        defaultFilters.vehicleBodyInsuranceNo !== undefined
      )
        initialFilterPayload.vehicleBodyInsuranceNo = defaultFilters.vehicleBodyInsuranceNo;
      if (
        includeFilter("vehicleMotionDirection") &&
        defaultFilters.vehicleMotionDirection !== undefined
      )
        initialFilterPayload.vehicleMotionDirection = defaultFilters.vehicleMotionDirection;
      if (
        includeFilter("vehicleMaxDamageSections") &&
        defaultFilters.vehicleMaxDamageSections !== undefined
      )
        initialFilterPayload.vehicleMaxDamageSections = defaultFilters.vehicleMaxDamageSections;
      if (
        includeFilter("vehicleDamageSectionOther") &&
        defaultFilters.vehicleDamageSectionOther !== undefined
      )
        initialFilterPayload.vehicleDamageSectionOther = defaultFilters.vehicleDamageSectionOther;
      if (
        includeFilter("vehicleInsuranceWarrantyLimit") &&
        defaultFilters.vehicleInsuranceWarrantyLimit !== undefined
      )
        initialFilterPayload.vehicleInsuranceWarrantyLimit =
          defaultFilters.vehicleInsuranceWarrantyLimit;
      if (
        includeFilter("vehicleInsuranceWarrantyLimitMin") &&
        defaultFilters.vehicleInsuranceWarrantyLimitMin !== undefined
      )
        initialFilterPayload.vehicleInsuranceWarrantyLimitMin =
          defaultFilters.vehicleInsuranceWarrantyLimitMin;
      if (
        includeFilter("vehicleInsuranceWarrantyLimitMax") &&
        defaultFilters.vehicleInsuranceWarrantyLimitMax !== undefined
      )
        initialFilterPayload.vehicleInsuranceWarrantyLimitMax =
          defaultFilters.vehicleInsuranceWarrantyLimitMax;

      // --- Driver in Vehicle DTOs Filters ---
      if (includeFilter("driverSex") && defaultFilters.driverSex !== undefined)
        initialFilterPayload.driverSex = defaultFilters.driverSex;
      if (includeFilter("driverFirstName") && defaultFilters.driverFirstName !== undefined)
        initialFilterPayload.driverFirstName = defaultFilters.driverFirstName;
      if (includeFilter("driverLastName") && defaultFilters.driverLastName !== undefined)
        initialFilterPayload.driverLastName = defaultFilters.driverLastName;
      if (includeFilter("driverNationalCode") && defaultFilters.driverNationalCode !== undefined)
        initialFilterPayload.driverNationalCode = defaultFilters.driverNationalCode;
      if (includeFilter("driverLicenceNumber") && defaultFilters.driverLicenceNumber !== undefined)
        initialFilterPayload.driverLicenceNumber = defaultFilters.driverLicenceNumber;
      if (includeFilter("driverLicenceType") && defaultFilters.driverLicenceType !== undefined)
        initialFilterPayload.driverLicenceType = defaultFilters.driverLicenceType;
      if (includeFilter("driverInjuryType") && defaultFilters.driverInjuryType !== undefined)
        initialFilterPayload.driverInjuryType = defaultFilters.driverInjuryType;
      if (includeFilter("driverTotalReason") && defaultFilters.driverTotalReason !== undefined)
        initialFilterPayload.driverTotalReason = defaultFilters.driverTotalReason;

      // --- Passenger in Vehicle DTOs Filters ---
      if (includeFilter("passengerSex") && defaultFilters.passengerSex !== undefined)
        initialFilterPayload.passengerSex = defaultFilters.passengerSex;
      if (includeFilter("passengerFirstName") && defaultFilters.passengerFirstName !== undefined)
        initialFilterPayload.passengerFirstName = defaultFilters.passengerFirstName;
      if (includeFilter("passengerLastName") && defaultFilters.passengerLastName !== undefined)
        initialFilterPayload.passengerLastName = defaultFilters.passengerLastName;
      if (includeFilter("passengerNationalCode") && defaultFilters.passengerNationalCode !== undefined)
        initialFilterPayload.passengerNationalCode = defaultFilters.passengerNationalCode;
      if (includeFilter("passengerInjuryType") && defaultFilters.passengerInjuryType !== undefined)
        initialFilterPayload.passengerInjuryType = defaultFilters.passengerInjuryType;
      if (includeFilter("passengerFaultStatus") && defaultFilters.passengerFaultStatus !== undefined)
        initialFilterPayload.passengerFaultStatus = defaultFilters.passengerFaultStatus;
      if (includeFilter("passengerTotalReason") && defaultFilters.passengerTotalReason !== undefined)
        initialFilterPayload.passengerTotalReason = defaultFilters.passengerTotalReason;

      // --- Pedestrian DTOs Filters ---
      if (includeFilter("pedestrianSex") && defaultFilters.pedestrianSex !== undefined)
        initialFilterPayload.pedestrianSex = defaultFilters.pedestrianSex;
      if (includeFilter("pedestrianFirstName") && defaultFilters.pedestrianFirstName !== undefined)
        initialFilterPayload.pedestrianFirstName = defaultFilters.pedestrianFirstName;
      if (includeFilter("pedestrianLastName") && defaultFilters.pedestrianLastName !== undefined)
        initialFilterPayload.pedestrianLastName = defaultFilters.pedestrianLastName;
      if (
        includeFilter("pedestrianNationalCode") &&
        defaultFilters.pedestrianNationalCode !== undefined
      )
        initialFilterPayload.pedestrianNationalCode = defaultFilters.pedestrianNationalCode;
      if (includeFilter("pedestrianInjuryType") && defaultFilters.pedestrianInjuryType !== undefined)
        initialFilterPayload.pedestrianInjuryType = defaultFilters.pedestrianInjuryType;
      if (includeFilter("pedestrianFaultStatus") && defaultFilters.pedestrianFaultStatus !== undefined)
        initialFilterPayload.pedestrianFaultStatus = defaultFilters.pedestrianFaultStatus;
      if (includeFilter("pedestrianTotalReason") && defaultFilters.pedestrianTotalReason !== undefined)
        initialFilterPayload.pedestrianTotalReason = defaultFilters.pedestrianTotalReason;

      // Now cast to the full type for the API call
      const completeInitialPayload =
        initialFilterPayload as ReqType["main"]["accident"]["temporalUnlicensedDriversAnalytics"]["set"];

      const cleanedParams = Object.fromEntries(
        Object.entries(completeInitialPayload).filter(
          ([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0),
        ),
      );

      const response = (await temporalUnlicensedDriversAnalytics({
        set: cleanedParams,
        get: { analytics: 1 },
      })) as TemporalUnlicensedDriversResponse;

      if (response.success && response.body) {
        setChartData(response.body.analytics);
        setAppliedFilters(defaultFilters);
      } else {
        setError("خطا در دریافت داده‌ها");
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError("خطا در بارگذاری داده‌ها");
    } finally {
      setIsLoading(false);
    }
  }, [ENABLED_FILTERS]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle filter application
  const handleApplyFilters = async (filterState: ChartFilterState) => {
    setIsLoading(true);
    setError(null);
    setChartData(null);
    setAppliedFilters(filterState);

    try {
      // Build the payload dynamically, only including enabled filters
      const filterPayload: Partial<
        ReqType["main"]["accident"]["temporalUnlicensedDriversAnalytics"]["set"]
      > = {};

      // Helper function to check if a filter should be included
      const includeFilter = (filterName: keyof ChartFilterState) => {
        return ENABLED_FILTERS.includes(filterName);
      };

      // --- Core Accident Details ---
      if (includeFilter("seri") && filterState.seri !== undefined)
        filterPayload.seri = filterState.seri;
      if (includeFilter("serial") && filterState.serial !== undefined)
        filterPayload.serial = filterState.serial;
      if (includeFilter("dateOfAccidentFrom") && filterState.dateOfAccidentFrom !== undefined)
        filterPayload.dateOfAccidentFrom = filterState.dateOfAccidentFrom;
      if (includeFilter("dateOfAccidentTo") && filterState.dateOfAccidentTo !== undefined)
        filterPayload.dateOfAccidentTo = filterState.dateOfAccidentTo;
      if (includeFilter("deadCount") && filterState.deadCount !== undefined)
        filterPayload.deadCount = filterState.deadCount;
      if (includeFilter("deadCountMin") && filterState.deadCountMin !== undefined)
        filterPayload.deadCountMin = filterState.deadCountMin;
      if (includeFilter("deadCountMax") && filterState.deadCountMax !== undefined)
        filterPayload.deadCountMax = filterState.deadCountMax;
      if (includeFilter("injuredCount") && filterState.injuredCount !== undefined)
        filterPayload.injuredCount = filterState.injuredCount;
      if (includeFilter("injuredCountMin") && filterState.injuredCountMin !== undefined)
        filterPayload.injuredCountMin = filterState.injuredCountMin;
      if (includeFilter("injuredCountMax") && filterState.injuredCountMax !== undefined)
        filterPayload.injuredCountMax = filterState.injuredCountMax;
      if (includeFilter("hasWitness") && filterState.hasWitness !== undefined)
        filterPayload.hasWitness = filterState.hasWitness;
      if (includeFilter("newsNumber") && filterState.newsNumber !== undefined)
        filterPayload.newsNumber = filterState.newsNumber;
      if (includeFilter("officer") && filterState.officer !== undefined)
        filterPayload.officer = filterState.officer;
      if (includeFilter("completionDateFrom") && filterState.completionDateFrom !== undefined)
        filterPayload.completionDateFrom = filterState.completionDateFrom;
      if (includeFilter("completionDateTo") && filterState.completionDateTo !== undefined)
        filterPayload.completionDateTo = filterState.completionDateTo;

      // --- Location & Context (multi-select) ---
      if (includeFilter("province") && filterState.province !== undefined)
        filterPayload.province = filterState.province;
      if (includeFilter("city") && filterState.city !== undefined)
        filterPayload.city = filterState.city;
      if (includeFilter("road") && filterState.road !== undefined)
        filterPayload.road = filterState.road;
      if (includeFilter("trafficZone") && filterState.trafficZone !== undefined)
        filterPayload.trafficZone = filterState.trafficZone;
      if (includeFilter("cityZone") && filterState.cityZone !== undefined)
        filterPayload.cityZone = filterState.cityZone;
      if (includeFilter("accidentType") && filterState.accidentType !== undefined)
        filterPayload.accidentType = filterState.accidentType;
      if (includeFilter("position") && filterState.position !== undefined)
        filterPayload.position = filterState.position;
      if (includeFilter("rulingType") && filterState.rulingType !== undefined)
        filterPayload.rulingType = filterState.rulingType;

      // --- Environmental & Reason-based (multi-select) ---
      if (includeFilter("lightStatus") && filterState.lightStatus !== undefined)
        filterPayload.lightStatus = filterState.lightStatus;
      if (includeFilter("collisionType") && filterState.collisionType !== undefined)
        filterPayload.collisionType = filterState.collisionType;
      if (includeFilter("roadSituation") && filterState.roadSituation !== undefined)
        filterPayload.roadSituation = filterState.roadSituation;
      if (includeFilter("roadRepairType") && filterState.roadRepairType !== undefined)
        filterPayload.roadRepairType = filterState.roadRepairType;
      if (includeFilter("shoulderStatus") && filterState.shoulderStatus !== undefined)
        filterPayload.shoulderStatus = filterState.shoulderStatus;
      if (includeFilter("areaUsages") && filterState.areaUsages !== undefined)
        filterPayload.areaUsages = filterState.areaUsages;
      if (includeFilter("airStatuses") && filterState.airStatuses !== undefined)
        filterPayload.airStatuses = filterState.airStatuses;
      if (includeFilter("roadDefects") && filterState.roadDefects !== undefined)
        filterPayload.roadDefects = filterState.roadDefects;
      if (includeFilter("humanReasons") && filterState.humanReasons !== undefined)
        filterPayload.humanReasons = filterState.humanReasons;
      if (includeFilter("vehicleReasons") && filterState.vehicleReasons !== undefined)
        filterPayload.vehicleReasons = filterState.vehicleReasons;
      if (includeFilter("equipmentDamages") && filterState.equipmentDamages !== undefined)
        filterPayload.equipmentDamages = filterState.equipmentDamages;
      if (includeFilter("roadSurfaceConditions") && filterState.roadSurfaceConditions !== undefined)
        filterPayload.roadSurfaceConditions = filterState.roadSurfaceConditions;

      // --- Attachments ---
      if (includeFilter("attachmentName") && filterState.attachmentName !== undefined)
        filterPayload.attachmentName = filterState.attachmentName;
      if (includeFilter("attachmentType") && filterState.attachmentType !== undefined)
        filterPayload.attachmentType = filterState.attachmentType;

      // --- Vehicle DTOs Filters ---
      if (includeFilter("vehicleColor") && filterState.vehicleColor !== undefined)
        filterPayload.vehicleColor = filterState.vehicleColor;
      if (includeFilter("vehicleSystem") && filterState.vehicleSystem !== undefined)
        filterPayload.vehicleSystem = filterState.vehicleSystem;
      if (includeFilter("vehiclePlaqueType") && filterState.vehiclePlaqueType !== undefined)
        filterPayload.vehiclePlaqueType = filterState.vehiclePlaqueType;
      if (includeFilter("vehicleSystemType") && filterState.vehicleSystemType !== undefined)
        filterPayload.vehicleSystemType = filterState.vehicleSystemType;
      if (includeFilter("vehicleFaultStatus") && filterState.vehicleFaultStatus !== undefined)
        filterPayload.vehicleFaultStatus = filterState.vehicleFaultStatus;
      if (includeFilter("vehicleInsuranceCo") && filterState.vehicleInsuranceCo !== undefined)
        filterPayload.vehicleInsuranceCo = filterState.vehicleInsuranceCo;
      if (includeFilter("vehicleInsuranceNo") && filterState.vehicleInsuranceNo !== undefined)
        filterPayload.vehicleInsuranceNo = filterState.vehicleInsuranceNo;
      if (includeFilter("vehiclePlaqueUsage") && filterState.vehiclePlaqueUsage !== undefined)
        filterPayload.vehiclePlaqueUsage = filterState.vehiclePlaqueUsage;
      if (includeFilter("vehiclePrintNumber") && filterState.vehiclePrintNumber !== undefined)
        filterPayload.vehiclePrintNumber = filterState.vehiclePrintNumber;
      if (
        includeFilter("vehiclePlaqueSerialElement") &&
        filterState.vehiclePlaqueSerialElement !== undefined
      )
        filterPayload.vehiclePlaqueSerialElement = filterState.vehiclePlaqueSerialElement;
      if (
        includeFilter("vehicleInsuranceDateFrom") &&
        filterState.vehicleInsuranceDateFrom !== undefined
      )
        filterPayload.vehicleInsuranceDateFrom = filterState.vehicleInsuranceDateFrom;
      if (includeFilter("vehicleInsuranceDateTo") && filterState.vehicleInsuranceDateTo !== undefined)
        filterPayload.vehicleInsuranceDateTo = filterState.vehicleInsuranceDateTo;
      if (includeFilter("vehicleBodyInsuranceCo") && filterState.vehicleBodyInsuranceCo !== undefined)
        filterPayload.vehicleBodyInsuranceCo = filterState.vehicleBodyInsuranceCo;
      if (includeFilter("vehicleBodyInsuranceNo") && filterState.vehicleBodyInsuranceNo !== undefined)
        filterPayload.vehicleBodyInsuranceNo = filterState.vehicleBodyInsuranceNo;
      if (includeFilter("vehicleMotionDirection") && filterState.vehicleMotionDirection !== undefined)
        filterPayload.vehicleMotionDirection = filterState.vehicleMotionDirection;
      if (
        includeFilter("vehicleMaxDamageSections") &&
        filterState.vehicleMaxDamageSections !== undefined
      )
        filterPayload.vehicleMaxDamageSections = filterState.vehicleMaxDamageSections;
      if (
        includeFilter("vehicleDamageSectionOther") &&
        filterState.vehicleDamageSectionOther !== undefined
      )
        filterPayload.vehicleDamageSectionOther = filterState.vehicleDamageSectionOther;
      if (
        includeFilter("vehicleInsuranceWarrantyLimit") &&
        filterState.vehicleInsuranceWarrantyLimit !== undefined
      )
        filterPayload.vehicleInsuranceWarrantyLimit = filterState.vehicleInsuranceWarrantyLimit;
      if (
        includeFilter("vehicleInsuranceWarrantyLimitMin") &&
        filterState.vehicleInsuranceWarrantyLimitMin !== undefined
      )
        filterPayload.vehicleInsuranceWarrantyLimitMin = filterState.vehicleInsuranceWarrantyLimitMin;
      if (
        includeFilter("vehicleInsuranceWarrantyLimitMax") &&
        filterState.vehicleInsuranceWarrantyLimitMax !== undefined
      )
        filterPayload.vehicleInsuranceWarrantyLimitMax = filterState.vehicleInsuranceWarrantyLimitMax;

      // --- Driver in Vehicle DTOs Filters ---
      if (includeFilter("driverSex") && filterState.driverSex !== undefined)
        filterPayload.driverSex = filterState.driverSex;
      if (includeFilter("driverFirstName") && filterState.driverFirstName !== undefined)
        filterPayload.driverFirstName = filterState.driverFirstName;
      if (includeFilter("driverLastName") && filterState.driverLastName !== undefined)
        filterPayload.driverLastName = filterState.driverLastName;
      if (includeFilter("driverNationalCode") && filterState.driverNationalCode !== undefined)
        filterPayload.driverNationalCode = filterState.driverNationalCode;
      if (includeFilter("driverLicenceNumber") && filterState.driverLicenceNumber !== undefined)
        filterPayload.driverLicenceNumber = filterState.driverLicenceNumber;
      if (includeFilter("driverLicenceType") && filterState.driverLicenceType !== undefined)
        filterPayload.driverLicenceType = filterState.driverLicenceType;
      if (includeFilter("driverInjuryType") && filterState.driverInjuryType !== undefined)
        filterPayload.driverInjuryType = filterState.driverInjuryType;
      if (includeFilter("driverTotalReason") && filterState.driverTotalReason !== undefined)
        filterPayload.driverTotalReason = filterState.driverTotalReason;

      // --- Passenger in Vehicle DTOs Filters ---
      if (includeFilter("passengerSex") && filterState.passengerSex !== undefined)
        filterPayload.passengerSex = filterState.passengerSex;
      if (includeFilter("passengerFirstName") && filterState.passengerFirstName !== undefined)
        filterPayload.passengerFirstName = filterState.passengerFirstName;
      if (includeFilter("passengerLastName") && filterState.passengerLastName !== undefined)
        filterPayload.passengerLastName = filterState.passengerLastName;
      if (includeFilter("passengerNationalCode") && filterState.passengerNationalCode !== undefined)
        filterPayload.passengerNationalCode = filterState.passengerNationalCode;
      if (includeFilter("passengerInjuryType") && filterState.passengerInjuryType !== undefined)
        filterPayload.passengerInjuryType = filterState.passengerInjuryType;
      if (includeFilter("passengerFaultStatus") && filterState.passengerFaultStatus !== undefined)
        filterPayload.passengerFaultStatus = filterState.passengerFaultStatus;
      if (includeFilter("passengerTotalReason") && filterState.passengerTotalReason !== undefined)
        filterPayload.passengerTotalReason = filterState.passengerTotalReason;

      // --- Pedestrian DTOs Filters ---
      if (includeFilter("pedestrianSex") && filterState.pedestrianSex !== undefined)
        filterPayload.pedestrianSex = filterState.pedestrianSex;
      if (includeFilter("pedestrianFirstName") && filterState.pedestrianFirstName !== undefined)
        filterPayload.pedestrianFirstName = filterState.pedestrianFirstName;
      if (includeFilter("pedestrianLastName") && filterState.pedestrianLastName !== undefined)
        filterPayload.pedestrianLastName = filterState.pedestrianLastName;
      if (includeFilter("pedestrianNationalCode") && filterState.pedestrianNationalCode !== undefined)
        filterPayload.pedestrianNationalCode = filterState.pedestrianNationalCode;
      if (includeFilter("pedestrianInjuryType") && filterState.pedestrianInjuryType !== undefined)
        filterPayload.pedestrianInjuryType = filterState.pedestrianInjuryType;
      if (includeFilter("pedestrianFaultStatus") && filterState.pedestrianFaultStatus !== undefined)
        filterPayload.pedestrianFaultStatus = filterState.pedestrianFaultStatus;
      if (includeFilter("pedestrianTotalReason") && filterState.pedestrianTotalReason !== undefined)
        filterPayload.pedestrianTotalReason = filterState.pedestrianTotalReason;

      // Now cast to the full type since we know all possible fields are covered
      const completeFilterPayload =
        filterPayload as ReqType["main"]["accident"]["temporalUnlicensedDriversAnalytics"]["set"];

      // Remove undefined values
      const cleanedParams = Object.fromEntries(
        Object.entries(completeFilterPayload).filter(
          ([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0),
        ),
      );

      const response = (await temporalUnlicensedDriversAnalytics({
        set: cleanedParams,
        get: { analytics: 1 },
      })) as TemporalUnlicensedDriversResponse;

      if (response.success && response.body) {
        setChartData(response.body.analytics);
      } else {
        setError("خطا در دریافت داده‌ها");
      }
    } catch (err) {
      console.error("Error applying filters:", err);
      setError("خطا در اعمال فیلترها");
    } finally {
      setIsLoading(false);
    }
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
      <ChartNavigation currentSection="temporal" currentChart="unlicensed-drivers-analytics" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              enabledFilters={ENABLED_FILTERS}
              title="فیلترهای تحلیل رانندگان بدون گواهینامه"
              description="برای تحلیل تصادفات رانندگان بدون گواهینامه، فیلترهای مورد نظر را اعمال کنید"
              enterpriseSettings={enterpriseSettings}
              activeAdvancedFilters={true}
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
                  مقایسه زمانی کاربران فاقد گواهینامه معتبر
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل روند زمانی تصادفات ناشی از رانندگان فاقد گواهینامه معتبر
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <AppliedFiltersDisplay filters={appliedFilters} />

          {/* Content */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span className="text-red-800 font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Chart */}
            <TemporalUnlicensedDriversChart data={chartData} isLoading={isLoading} />

            {/* Analysis Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📊 درباره این تحلیل</h3>
              <p className="text-blue-800 text-sm">
                این نمودار روند زمانی تصادفات ناشی از رانندگان فاقد گواهینامه معتبر را نشان می‌دهد. این
                تحلیل به شناسایی الگوهای زمانی و روندهای تصادفات مرتبط با عدم داشتن گواهینامه کمک
                می‌کند.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalUnlicensedDriversAnalyticsPage;
