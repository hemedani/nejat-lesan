"use client";

import React, { useState, useEffect, useCallback } from "react";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import ChartsFilterSidebar, {
  ChartFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChart } from "@/utils/chartFilters";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import TemporalNightChart from "@/components/charts/TemporalNightChart";
import { temporalNightAnalytics } from "@/app/actions/accident/temporalNightAnalytics";
import { ReqType } from "@/types/declarations/selectInp";

interface ChartSeries {
  name: string;
  data: number[];
}

interface TemporalNightData {
  categories: string[];
  series: ChartSeries[];
}

interface TemporalNightResponse {
  body: {
    analytics: TemporalNightData;
  };
  success: boolean;
}

// Get enabled filters for temporal night analytics
const ENABLED_FILTERS = getEnabledFiltersForChart("TEMPORAL_NIGHT_ANALYTICS");

// Demo data for fallback
const DEMO_DATA: TemporalNightData = {
  categories: [
    "1401-01",
    "1401-02",
    "1401-03",
    "1401-04",
    "1401-05",
    "1401-06",
    "1401-07",
    "1401-08",
    "1401-09",
    "1401-10",
    "1401-11",
    "1401-12",
  ],
  series: [
    {
      name: "شب با روشنایی کافی",
      data: [120, 145, 98, 187, 234, 267, 298, 256, 189, 167, 134, 112],
    },
    {
      name: "شب بدون روشنایی کافی",
      data: [89, 112, 145, 198, 267, 234, 189, 212, 178, 134, 123, 98],
    },
  ],
};

const TemporalNightAnalyticsPage = () => {
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<TemporalNightData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ChartFilterState>({});

  // Get default filters for initial load
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
      lightStatus: [], // ← but hardcoded to 2 values in pipeline
      collisionType: [],
      roadSituation: [],
      roadRepairType: [],
      shoulderStatus: [],

      // --- Environmental & Reason-based ---
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

  // Load initial data on component mount
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setChartData(null);

    try {
      const defaultFilters = getDefaultFilters();

      // Build the initial payload dynamically with only enabled filters
      const initialFilterPayload: Partial<
        ReqType["main"]["accident"]["temporalNightAnalytics"]["set"]
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
      if (
        includeFilter("dateOfAccidentFrom") &&
        defaultFilters.dateOfAccidentFrom !== undefined
      )
        initialFilterPayload.dateOfAccidentFrom =
          defaultFilters.dateOfAccidentFrom;
      if (
        includeFilter("dateOfAccidentTo") &&
        defaultFilters.dateOfAccidentTo !== undefined
      )
        initialFilterPayload.dateOfAccidentTo = defaultFilters.dateOfAccidentTo;
      if (includeFilter("deadCount") && defaultFilters.deadCount !== undefined)
        initialFilterPayload.deadCount = defaultFilters.deadCount;
      if (
        includeFilter("deadCountMin") &&
        defaultFilters.deadCountMin !== undefined
      )
        initialFilterPayload.deadCountMin = defaultFilters.deadCountMin;
      if (
        includeFilter("deadCountMax") &&
        defaultFilters.deadCountMax !== undefined
      )
        initialFilterPayload.deadCountMax = defaultFilters.deadCountMax;
      if (
        includeFilter("injuredCount") &&
        defaultFilters.injuredCount !== undefined
      )
        initialFilterPayload.injuredCount = defaultFilters.injuredCount;
      if (
        includeFilter("injuredCountMin") &&
        defaultFilters.injuredCountMin !== undefined
      )
        initialFilterPayload.injuredCountMin = defaultFilters.injuredCountMin;
      if (
        includeFilter("injuredCountMax") &&
        defaultFilters.injuredCountMax !== undefined
      )
        initialFilterPayload.injuredCountMax = defaultFilters.injuredCountMax;
      if (
        includeFilter("hasWitness") &&
        defaultFilters.hasWitness !== undefined
      )
        initialFilterPayload.hasWitness = defaultFilters.hasWitness;
      if (
        includeFilter("newsNumber") &&
        defaultFilters.newsNumber !== undefined
      )
        initialFilterPayload.newsNumber = defaultFilters.newsNumber;
      if (includeFilter("officer") && defaultFilters.officer !== undefined)
        initialFilterPayload.officer = defaultFilters.officer;
      if (
        includeFilter("completionDateFrom") &&
        defaultFilters.completionDateFrom !== undefined
      )
        initialFilterPayload.completionDateFrom =
          defaultFilters.completionDateFrom;
      if (
        includeFilter("completionDateTo") &&
        defaultFilters.completionDateTo !== undefined
      )
        initialFilterPayload.completionDateTo = defaultFilters.completionDateTo;

      // --- Location & Context (multi-select) ---
      if (includeFilter("province") && defaultFilters.province !== undefined)
        initialFilterPayload.province = defaultFilters.province;
      if (includeFilter("city") && defaultFilters.city !== undefined)
        initialFilterPayload.city = defaultFilters.city;
      if (includeFilter("road") && defaultFilters.road !== undefined)
        initialFilterPayload.road = defaultFilters.road;
      if (
        includeFilter("trafficZone") &&
        defaultFilters.trafficZone !== undefined
      )
        initialFilterPayload.trafficZone = defaultFilters.trafficZone;
      if (includeFilter("cityZone") && defaultFilters.cityZone !== undefined)
        initialFilterPayload.cityZone = defaultFilters.cityZone;
      if (
        includeFilter("accidentType") &&
        defaultFilters.accidentType !== undefined
      )
        initialFilterPayload.accidentType = defaultFilters.accidentType;
      if (includeFilter("position") && defaultFilters.position !== undefined)
        initialFilterPayload.position = defaultFilters.position;
      if (
        includeFilter("rulingType") &&
        defaultFilters.rulingType !== undefined
      )
        initialFilterPayload.rulingType = defaultFilters.rulingType;

      // --- Environmental & Reason-based (multi-select) ---
      if (
        includeFilter("lightStatus") &&
        defaultFilters.lightStatus !== undefined
      )
        initialFilterPayload.lightStatus = defaultFilters.lightStatus;
      if (
        includeFilter("collisionType") &&
        defaultFilters.collisionType !== undefined
      )
        initialFilterPayload.collisionType = defaultFilters.collisionType;
      if (
        includeFilter("roadSituation") &&
        defaultFilters.roadSituation !== undefined
      )
        initialFilterPayload.roadSituation = defaultFilters.roadSituation;
      if (
        includeFilter("roadRepairType") &&
        defaultFilters.roadRepairType !== undefined
      )
        initialFilterPayload.roadRepairType = defaultFilters.roadRepairType;
      if (
        includeFilter("shoulderStatus") &&
        defaultFilters.shoulderStatus !== undefined
      )
        initialFilterPayload.shoulderStatus = defaultFilters.shoulderStatus;
      if (
        includeFilter("areaUsages") &&
        defaultFilters.areaUsages !== undefined
      )
        initialFilterPayload.areaUsages = defaultFilters.areaUsages;
      if (
        includeFilter("airStatuses") &&
        defaultFilters.airStatuses !== undefined
      )
        initialFilterPayload.airStatuses = defaultFilters.airStatuses;
      if (
        includeFilter("roadDefects") &&
        defaultFilters.roadDefects !== undefined
      )
        initialFilterPayload.roadDefects = defaultFilters.roadDefects;
      if (
        includeFilter("humanReasons") &&
        defaultFilters.humanReasons !== undefined
      )
        initialFilterPayload.humanReasons = defaultFilters.humanReasons;
      if (
        includeFilter("vehicleReasons") &&
        defaultFilters.vehicleReasons !== undefined
      )
        initialFilterPayload.vehicleReasons = defaultFilters.vehicleReasons;
      if (
        includeFilter("equipmentDamages") &&
        defaultFilters.equipmentDamages !== undefined
      )
        initialFilterPayload.equipmentDamages = defaultFilters.equipmentDamages;
      if (
        includeFilter("roadSurfaceConditions") &&
        defaultFilters.roadSurfaceConditions !== undefined
      )
        initialFilterPayload.roadSurfaceConditions =
          defaultFilters.roadSurfaceConditions;

      // --- Attachments ---
      if (
        includeFilter("attachmentName") &&
        defaultFilters.attachmentName !== undefined
      )
        initialFilterPayload.attachmentName = defaultFilters.attachmentName;
      if (
        includeFilter("attachmentType") &&
        defaultFilters.attachmentType !== undefined
      )
        initialFilterPayload.attachmentType = defaultFilters.attachmentType;

      // --- Vehicle DTOs Filters ---
      if (
        includeFilter("vehicleColor") &&
        defaultFilters.vehicleColor !== undefined
      )
        initialFilterPayload.vehicleColor = defaultFilters.vehicleColor;
      if (
        includeFilter("vehicleSystem") &&
        defaultFilters.vehicleSystem !== undefined
      )
        initialFilterPayload.vehicleSystem = defaultFilters.vehicleSystem;
      if (
        includeFilter("vehiclePlaqueType") &&
        defaultFilters.vehiclePlaqueType !== undefined
      )
        initialFilterPayload.vehiclePlaqueType =
          defaultFilters.vehiclePlaqueType;
      if (
        includeFilter("vehicleSystemType") &&
        defaultFilters.vehicleSystemType !== undefined
      )
        initialFilterPayload.vehicleSystemType =
          defaultFilters.vehicleSystemType;
      if (
        includeFilter("vehicleFaultStatus") &&
        defaultFilters.vehicleFaultStatus !== undefined
      )
        initialFilterPayload.vehicleFaultStatus =
          defaultFilters.vehicleFaultStatus;
      if (
        includeFilter("vehicleInsuranceCo") &&
        defaultFilters.vehicleInsuranceCo !== undefined
      )
        initialFilterPayload.vehicleInsuranceCo =
          defaultFilters.vehicleInsuranceCo;
      if (
        includeFilter("vehicleInsuranceNo") &&
        defaultFilters.vehicleInsuranceNo !== undefined
      )
        initialFilterPayload.vehicleInsuranceNo =
          defaultFilters.vehicleInsuranceNo;
      if (
        includeFilter("vehiclePlaqueUsage") &&
        defaultFilters.vehiclePlaqueUsage !== undefined
      )
        initialFilterPayload.vehiclePlaqueUsage =
          defaultFilters.vehiclePlaqueUsage;
      if (
        includeFilter("vehiclePrintNumber") &&
        defaultFilters.vehiclePrintNumber !== undefined
      )
        initialFilterPayload.vehiclePrintNumber =
          defaultFilters.vehiclePrintNumber;
      if (
        includeFilter("vehiclePlaqueSerialElement") &&
        defaultFilters.vehiclePlaqueSerialElement !== undefined
      )
        initialFilterPayload.vehiclePlaqueSerialElement =
          defaultFilters.vehiclePlaqueSerialElement;
      if (
        includeFilter("vehicleInsuranceDateFrom") &&
        defaultFilters.vehicleInsuranceDateFrom !== undefined
      )
        initialFilterPayload.vehicleInsuranceDateFrom =
          defaultFilters.vehicleInsuranceDateFrom;
      if (
        includeFilter("vehicleInsuranceDateTo") &&
        defaultFilters.vehicleInsuranceDateTo !== undefined
      )
        initialFilterPayload.vehicleInsuranceDateTo =
          defaultFilters.vehicleInsuranceDateTo;
      if (
        includeFilter("vehicleBodyInsuranceCo") &&
        defaultFilters.vehicleBodyInsuranceCo !== undefined
      )
        initialFilterPayload.vehicleBodyInsuranceCo =
          defaultFilters.vehicleBodyInsuranceCo;
      if (
        includeFilter("vehicleBodyInsuranceNo") &&
        defaultFilters.vehicleBodyInsuranceNo !== undefined
      )
        initialFilterPayload.vehicleBodyInsuranceNo =
          defaultFilters.vehicleBodyInsuranceNo;
      if (
        includeFilter("vehicleMotionDirection") &&
        defaultFilters.vehicleMotionDirection !== undefined
      )
        initialFilterPayload.vehicleMotionDirection =
          defaultFilters.vehicleMotionDirection;
      if (
        includeFilter("vehicleMaxDamageSections") &&
        defaultFilters.vehicleMaxDamageSections !== undefined
      )
        initialFilterPayload.vehicleMaxDamageSections =
          defaultFilters.vehicleMaxDamageSections;
      if (
        includeFilter("vehicleDamageSectionOther") &&
        defaultFilters.vehicleDamageSectionOther !== undefined
      )
        initialFilterPayload.vehicleDamageSectionOther =
          defaultFilters.vehicleDamageSectionOther;
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
      if (
        includeFilter("driverFirstName") &&
        defaultFilters.driverFirstName !== undefined
      )
        initialFilterPayload.driverFirstName = defaultFilters.driverFirstName;
      if (
        includeFilter("driverLastName") &&
        defaultFilters.driverLastName !== undefined
      )
        initialFilterPayload.driverLastName = defaultFilters.driverLastName;
      if (
        includeFilter("driverNationalCode") &&
        defaultFilters.driverNationalCode !== undefined
      )
        initialFilterPayload.driverNationalCode =
          defaultFilters.driverNationalCode;
      if (
        includeFilter("driverLicenceNumber") &&
        defaultFilters.driverLicenceNumber !== undefined
      )
        initialFilterPayload.driverLicenceNumber =
          defaultFilters.driverLicenceNumber;
      if (
        includeFilter("driverLicenceType") &&
        defaultFilters.driverLicenceType !== undefined
      )
        initialFilterPayload.driverLicenceType =
          defaultFilters.driverLicenceType;
      if (
        includeFilter("driverInjuryType") &&
        defaultFilters.driverInjuryType !== undefined
      )
        initialFilterPayload.driverInjuryType = defaultFilters.driverInjuryType;
      if (
        includeFilter("driverTotalReason") &&
        defaultFilters.driverTotalReason !== undefined
      )
        initialFilterPayload.driverTotalReason =
          defaultFilters.driverTotalReason;

      // --- Passenger in Vehicle DTOs Filters ---
      if (
        includeFilter("passengerSex") &&
        defaultFilters.passengerSex !== undefined
      )
        initialFilterPayload.passengerSex = defaultFilters.passengerSex;
      if (
        includeFilter("passengerFirstName") &&
        defaultFilters.passengerFirstName !== undefined
      )
        initialFilterPayload.passengerFirstName =
          defaultFilters.passengerFirstName;
      if (
        includeFilter("passengerLastName") &&
        defaultFilters.passengerLastName !== undefined
      )
        initialFilterPayload.passengerLastName =
          defaultFilters.passengerLastName;
      if (
        includeFilter("passengerNationalCode") &&
        defaultFilters.passengerNationalCode !== undefined
      )
        initialFilterPayload.passengerNationalCode =
          defaultFilters.passengerNationalCode;
      if (
        includeFilter("passengerInjuryType") &&
        defaultFilters.passengerInjuryType !== undefined
      )
        initialFilterPayload.passengerInjuryType =
          defaultFilters.passengerInjuryType;
      if (
        includeFilter("passengerFaultStatus") &&
        defaultFilters.passengerFaultStatus !== undefined
      )
        initialFilterPayload.passengerFaultStatus =
          defaultFilters.passengerFaultStatus;
      if (
        includeFilter("passengerTotalReason") &&
        defaultFilters.passengerTotalReason !== undefined
      )
        initialFilterPayload.passengerTotalReason =
          defaultFilters.passengerTotalReason;

      // --- Pedestrian DTOs Filters ---
      if (
        includeFilter("pedestrianSex") &&
        defaultFilters.pedestrianSex !== undefined
      )
        initialFilterPayload.pedestrianSex = defaultFilters.pedestrianSex;
      if (
        includeFilter("pedestrianFirstName") &&
        defaultFilters.pedestrianFirstName !== undefined
      )
        initialFilterPayload.pedestrianFirstName =
          defaultFilters.pedestrianFirstName;
      if (
        includeFilter("pedestrianLastName") &&
        defaultFilters.pedestrianLastName !== undefined
      )
        initialFilterPayload.pedestrianLastName =
          defaultFilters.pedestrianLastName;
      if (
        includeFilter("pedestrianNationalCode") &&
        defaultFilters.pedestrianNationalCode !== undefined
      )
        initialFilterPayload.pedestrianNationalCode =
          defaultFilters.pedestrianNationalCode;
      if (
        includeFilter("pedestrianInjuryType") &&
        defaultFilters.pedestrianInjuryType !== undefined
      )
        initialFilterPayload.pedestrianInjuryType =
          defaultFilters.pedestrianInjuryType;
      if (
        includeFilter("pedestrianFaultStatus") &&
        defaultFilters.pedestrianFaultStatus !== undefined
      )
        initialFilterPayload.pedestrianFaultStatus =
          defaultFilters.pedestrianFaultStatus;
      if (
        includeFilter("pedestrianTotalReason") &&
        defaultFilters.pedestrianTotalReason !== undefined
      )
        initialFilterPayload.pedestrianTotalReason =
          defaultFilters.pedestrianTotalReason;

      // Now cast to the full type for the API call
      const completeInitialPayload =
        initialFilterPayload as ReqType["main"]["accident"]["temporalNightAnalytics"]["set"];

      const cleanedParams = Object.fromEntries(
        Object.entries(completeInitialPayload).filter(
          ([, value]) =>
            value !== undefined && (!Array.isArray(value) || value.length > 0),
        ),
      );

      const response = (await temporalNightAnalytics({
        set: cleanedParams,
        get: { analytics: 1 },
      })) as TemporalNightResponse;

      if (response.success && response.body?.analytics) {
        setChartData(response.body.analytics);
        setIsDemoMode(false);
      } else {
        console.warn("API failed, using demo data:", response);
        setChartData(DEMO_DATA);
        setIsDemoMode(true);
        setError(null);
      }
    } catch (err) {
      console.warn("Network error, using demo data:", err);
      setChartData(DEMO_DATA);
      setIsDemoMode(true);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle manual data loading
  const handleLoadData = async () => {
    await loadInitialData();
  };

  // Handle filter submission
  // Handle filter application
  const handleApplyFilters = async (filters: ChartFilterState) => {
    setAppliedFilters(filters);
    setIsLoading(true);
    setError(null);
    setChartData(null);

    try {
      // Build the payload dynamically, only including enabled filters
      const filterPayload: Partial<
        ReqType["main"]["accident"]["temporalNightAnalytics"]["set"]
      > = {};

      // Helper function to check if a filter should be included
      const includeFilter = (filterName: keyof ChartFilterState) => {
        return ENABLED_FILTERS.includes(filterName);
      };

      // --- Core Accident Details ---
      if (includeFilter("seri") && filters.seri !== undefined)
        filterPayload.seri = filters.seri;
      if (includeFilter("serial") && filters.serial !== undefined)
        filterPayload.serial = filters.serial;
      if (
        includeFilter("dateOfAccidentFrom") &&
        filters.dateOfAccidentFrom !== undefined
      )
        filterPayload.dateOfAccidentFrom = filters.dateOfAccidentFrom;
      if (
        includeFilter("dateOfAccidentTo") &&
        filters.dateOfAccidentTo !== undefined
      )
        filterPayload.dateOfAccidentTo = filters.dateOfAccidentTo;
      if (includeFilter("deadCount") && filters.deadCount !== undefined)
        filterPayload.deadCount = filters.deadCount;
      if (includeFilter("deadCountMin") && filters.deadCountMin !== undefined)
        filterPayload.deadCountMin = filters.deadCountMin;
      if (includeFilter("deadCountMax") && filters.deadCountMax !== undefined)
        filterPayload.deadCountMax = filters.deadCountMax;
      if (includeFilter("injuredCount") && filters.injuredCount !== undefined)
        filterPayload.injuredCount = filters.injuredCount;
      if (
        includeFilter("injuredCountMin") &&
        filters.injuredCountMin !== undefined
      )
        filterPayload.injuredCountMin = filters.injuredCountMin;
      if (
        includeFilter("injuredCountMax") &&
        filters.injuredCountMax !== undefined
      )
        filterPayload.injuredCountMax = filters.injuredCountMax;
      if (includeFilter("hasWitness") && filters.hasWitness !== undefined)
        filterPayload.hasWitness = filters.hasWitness;
      if (includeFilter("newsNumber") && filters.newsNumber !== undefined)
        filterPayload.newsNumber = filters.newsNumber;
      if (includeFilter("officer") && filters.officer !== undefined)
        filterPayload.officer = filters.officer;
      if (
        includeFilter("completionDateFrom") &&
        filters.completionDateFrom !== undefined
      )
        filterPayload.completionDateFrom = filters.completionDateFrom;
      if (
        includeFilter("completionDateTo") &&
        filters.completionDateTo !== undefined
      )
        filterPayload.completionDateTo = filters.completionDateTo;

      // --- Location & Context (multi-select) ---
      if (includeFilter("province") && filters.province !== undefined)
        filterPayload.province = filters.province;
      if (includeFilter("city") && filters.city !== undefined)
        filterPayload.city = filters.city;
      if (includeFilter("road") && filters.road !== undefined)
        filterPayload.road = filters.road;
      if (includeFilter("trafficZone") && filters.trafficZone !== undefined)
        filterPayload.trafficZone = filters.trafficZone;
      if (includeFilter("cityZone") && filters.cityZone !== undefined)
        filterPayload.cityZone = filters.cityZone;
      if (includeFilter("accidentType") && filters.accidentType !== undefined)
        filterPayload.accidentType = filters.accidentType;
      if (includeFilter("position") && filters.position !== undefined)
        filterPayload.position = filters.position;
      if (includeFilter("rulingType") && filters.rulingType !== undefined)
        filterPayload.rulingType = filters.rulingType;

      // --- Environmental & Reason-based (multi-select) ---
      if (includeFilter("lightStatus") && filters.lightStatus !== undefined)
        filterPayload.lightStatus = filters.lightStatus;
      if (includeFilter("collisionType") && filters.collisionType !== undefined)
        filterPayload.collisionType = filters.collisionType;
      if (includeFilter("roadSituation") && filters.roadSituation !== undefined)
        filterPayload.roadSituation = filters.roadSituation;
      if (
        includeFilter("roadRepairType") &&
        filters.roadRepairType !== undefined
      )
        filterPayload.roadRepairType = filters.roadRepairType;
      if (
        includeFilter("shoulderStatus") &&
        filters.shoulderStatus !== undefined
      )
        filterPayload.shoulderStatus = filters.shoulderStatus;
      if (includeFilter("areaUsages") && filters.areaUsages !== undefined)
        filterPayload.areaUsages = filters.areaUsages;
      if (includeFilter("airStatuses") && filters.airStatuses !== undefined)
        filterPayload.airStatuses = filters.airStatuses;
      if (includeFilter("roadDefects") && filters.roadDefects !== undefined)
        filterPayload.roadDefects = filters.roadDefects;
      if (includeFilter("humanReasons") && filters.humanReasons !== undefined)
        filterPayload.humanReasons = filters.humanReasons;
      if (
        includeFilter("vehicleReasons") &&
        filters.vehicleReasons !== undefined
      )
        filterPayload.vehicleReasons = filters.vehicleReasons;
      if (
        includeFilter("equipmentDamages") &&
        filters.equipmentDamages !== undefined
      )
        filterPayload.equipmentDamages = filters.equipmentDamages;
      if (
        includeFilter("roadSurfaceConditions") &&
        filters.roadSurfaceConditions !== undefined
      )
        filterPayload.roadSurfaceConditions = filters.roadSurfaceConditions;

      // --- Attachments ---
      if (
        includeFilter("attachmentName") &&
        filters.attachmentName !== undefined
      )
        filterPayload.attachmentName = filters.attachmentName;
      if (
        includeFilter("attachmentType") &&
        filters.attachmentType !== undefined
      )
        filterPayload.attachmentType = filters.attachmentType;

      // --- Vehicle DTOs Filters ---
      if (includeFilter("vehicleColor") && filters.vehicleColor !== undefined)
        filterPayload.vehicleColor = filters.vehicleColor;
      if (includeFilter("vehicleSystem") && filters.vehicleSystem !== undefined)
        filterPayload.vehicleSystem = filters.vehicleSystem;
      if (
        includeFilter("vehiclePlaqueType") &&
        filters.vehiclePlaqueType !== undefined
      )
        filterPayload.vehiclePlaqueType = filters.vehiclePlaqueType;
      if (
        includeFilter("vehicleSystemType") &&
        filters.vehicleSystemType !== undefined
      )
        filterPayload.vehicleSystemType = filters.vehicleSystemType;
      if (
        includeFilter("vehicleFaultStatus") &&
        filters.vehicleFaultStatus !== undefined
      )
        filterPayload.vehicleFaultStatus = filters.vehicleFaultStatus;
      if (
        includeFilter("vehicleInsuranceCo") &&
        filters.vehicleInsuranceCo !== undefined
      )
        filterPayload.vehicleInsuranceCo = filters.vehicleInsuranceCo;
      if (
        includeFilter("vehicleInsuranceNo") &&
        filters.vehicleInsuranceNo !== undefined
      )
        filterPayload.vehicleInsuranceNo = filters.vehicleInsuranceNo;
      if (
        includeFilter("vehiclePlaqueUsage") &&
        filters.vehiclePlaqueUsage !== undefined
      )
        filterPayload.vehiclePlaqueUsage = filters.vehiclePlaqueUsage;
      if (
        includeFilter("vehiclePrintNumber") &&
        filters.vehiclePrintNumber !== undefined
      )
        filterPayload.vehiclePrintNumber = filters.vehiclePrintNumber;
      if (
        includeFilter("vehiclePlaqueSerialElement") &&
        filters.vehiclePlaqueSerialElement !== undefined
      )
        filterPayload.vehiclePlaqueSerialElement =
          filters.vehiclePlaqueSerialElement;
      if (
        includeFilter("vehicleInsuranceDateFrom") &&
        filters.vehicleInsuranceDateFrom !== undefined
      )
        filterPayload.vehicleInsuranceDateFrom =
          filters.vehicleInsuranceDateFrom;
      if (
        includeFilter("vehicleInsuranceDateTo") &&
        filters.vehicleInsuranceDateTo !== undefined
      )
        filterPayload.vehicleInsuranceDateTo = filters.vehicleInsuranceDateTo;
      if (
        includeFilter("vehicleBodyInsuranceCo") &&
        filters.vehicleBodyInsuranceCo !== undefined
      )
        filterPayload.vehicleBodyInsuranceCo = filters.vehicleBodyInsuranceCo;
      if (
        includeFilter("vehicleBodyInsuranceNo") &&
        filters.vehicleBodyInsuranceNo !== undefined
      )
        filterPayload.vehicleBodyInsuranceNo = filters.vehicleBodyInsuranceNo;
      if (
        includeFilter("vehicleMotionDirection") &&
        filters.vehicleMotionDirection !== undefined
      )
        filterPayload.vehicleMotionDirection = filters.vehicleMotionDirection;
      if (
        includeFilter("vehicleMaxDamageSections") &&
        filters.vehicleMaxDamageSections !== undefined
      )
        filterPayload.vehicleMaxDamageSections =
          filters.vehicleMaxDamageSections;
      if (
        includeFilter("vehicleDamageSectionOther") &&
        filters.vehicleDamageSectionOther !== undefined
      )
        filterPayload.vehicleDamageSectionOther =
          filters.vehicleDamageSectionOther;
      if (
        includeFilter("vehicleInsuranceWarrantyLimit") &&
        filters.vehicleInsuranceWarrantyLimit !== undefined
      )
        filterPayload.vehicleInsuranceWarrantyLimit =
          filters.vehicleInsuranceWarrantyLimit;
      if (
        includeFilter("vehicleInsuranceWarrantyLimitMin") &&
        filters.vehicleInsuranceWarrantyLimitMin !== undefined
      )
        filterPayload.vehicleInsuranceWarrantyLimitMin =
          filters.vehicleInsuranceWarrantyLimitMin;
      if (
        includeFilter("vehicleInsuranceWarrantyLimitMax") &&
        filters.vehicleInsuranceWarrantyLimitMax !== undefined
      )
        filterPayload.vehicleInsuranceWarrantyLimitMax =
          filters.vehicleInsuranceWarrantyLimitMax;

      // --- Driver in Vehicle DTOs Filters ---
      if (includeFilter("driverSex") && filters.driverSex !== undefined)
        filterPayload.driverSex = filters.driverSex;
      if (
        includeFilter("driverFirstName") &&
        filters.driverFirstName !== undefined
      )
        filterPayload.driverFirstName = filters.driverFirstName;
      if (
        includeFilter("driverLastName") &&
        filters.driverLastName !== undefined
      )
        filterPayload.driverLastName = filters.driverLastName;
      if (
        includeFilter("driverNationalCode") &&
        filters.driverNationalCode !== undefined
      )
        filterPayload.driverNationalCode = filters.driverNationalCode;
      if (
        includeFilter("driverLicenceNumber") &&
        filters.driverLicenceNumber !== undefined
      )
        filterPayload.driverLicenceNumber = filters.driverLicenceNumber;
      if (
        includeFilter("driverLicenceType") &&
        filters.driverLicenceType !== undefined
      )
        filterPayload.driverLicenceType = filters.driverLicenceType;
      if (
        includeFilter("driverInjuryType") &&
        filters.driverInjuryType !== undefined
      )
        filterPayload.driverInjuryType = filters.driverInjuryType;
      if (
        includeFilter("driverTotalReason") &&
        filters.driverTotalReason !== undefined
      )
        filterPayload.driverTotalReason = filters.driverTotalReason;

      // --- Passenger in Vehicle DTOs Filters ---
      if (includeFilter("passengerSex") && filters.passengerSex !== undefined)
        filterPayload.passengerSex = filters.passengerSex;
      if (
        includeFilter("passengerFirstName") &&
        filters.passengerFirstName !== undefined
      )
        filterPayload.passengerFirstName = filters.passengerFirstName;
      if (
        includeFilter("passengerLastName") &&
        filters.passengerLastName !== undefined
      )
        filterPayload.passengerLastName = filters.passengerLastName;
      if (
        includeFilter("passengerNationalCode") &&
        filters.passengerNationalCode !== undefined
      )
        filterPayload.passengerNationalCode = filters.passengerNationalCode;
      if (
        includeFilter("passengerInjuryType") &&
        filters.passengerInjuryType !== undefined
      )
        filterPayload.passengerInjuryType = filters.passengerInjuryType;
      if (
        includeFilter("passengerFaultStatus") &&
        filters.passengerFaultStatus !== undefined
      )
        filterPayload.passengerFaultStatus = filters.passengerFaultStatus;
      if (
        includeFilter("passengerTotalReason") &&
        filters.passengerTotalReason !== undefined
      )
        filterPayload.passengerTotalReason = filters.passengerTotalReason;

      // --- Pedestrian DTOs Filters ---
      if (includeFilter("pedestrianSex") && filters.pedestrianSex !== undefined)
        filterPayload.pedestrianSex = filters.pedestrianSex;
      if (
        includeFilter("pedestrianFirstName") &&
        filters.pedestrianFirstName !== undefined
      )
        filterPayload.pedestrianFirstName = filters.pedestrianFirstName;
      if (
        includeFilter("pedestrianLastName") &&
        filters.pedestrianLastName !== undefined
      )
        filterPayload.pedestrianLastName = filters.pedestrianLastName;
      if (
        includeFilter("pedestrianNationalCode") &&
        filters.pedestrianNationalCode !== undefined
      )
        filterPayload.pedestrianNationalCode = filters.pedestrianNationalCode;
      if (
        includeFilter("pedestrianInjuryType") &&
        filters.pedestrianInjuryType !== undefined
      )
        filterPayload.pedestrianInjuryType = filters.pedestrianInjuryType;
      if (
        includeFilter("pedestrianFaultStatus") &&
        filters.pedestrianFaultStatus !== undefined
      )
        filterPayload.pedestrianFaultStatus = filters.pedestrianFaultStatus;
      if (
        includeFilter("pedestrianTotalReason") &&
        filters.pedestrianTotalReason !== undefined
      )
        filterPayload.pedestrianTotalReason = filters.pedestrianTotalReason;

      // Now cast to the full type since we know all possible fields are covered
      const completeFilterPayload =
        filterPayload as ReqType["main"]["accident"]["temporalNightAnalytics"]["set"];

      // Remove undefined values
      const cleanedParams = Object.fromEntries(
        Object.entries(completeFilterPayload).filter(
          ([, value]) =>
            value !== undefined && (!Array.isArray(value) || value.length > 0),
        ),
      );

      const response = (await temporalNightAnalytics({
        set: cleanedParams,
        get: { analytics: 1 },
      })) as TemporalNightResponse;

      if (response.success && response.body?.analytics) {
        setChartData(response.body.analytics);
        setIsDemoMode(false);
      } else {
        console.warn("Filter API failed, using demo data:", response);
        setChartData(DEMO_DATA);
        setIsDemoMode(true);
        setError(null);
      }
    } catch (err) {
      console.warn("Filter network error, using demo data:", err);
      setChartData(DEMO_DATA);
      setIsDemoMode(true);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter configuration
  const getFilterConfig = () => {
    return {
      disableSeverityFilter: false,
      disableCollisionTypeFilter: false,
      disableLightingFilter: true, // Disable lighting filter since this chart is specifically about night conditions
      lockToSevereAccidents: false,
    };
  };

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Calculate statistics
  const getStatistics = () => {
    if (!chartData || !chartData.series || chartData.series.length === 0)
      return null;

    const wellLitSeries = chartData.series.find((s) =>
      s.name.includes("با روشنایی کافی"),
    );
    const poorlyLitSeries = chartData.series.find((s) =>
      s.name.includes("بدون روشنایی کافی"),
    );

    const wellLitTotal = wellLitSeries
      ? wellLitSeries.data.reduce((sum, val) => sum + val, 0)
      : 0;
    const poorlyLitTotal = poorlyLitSeries
      ? poorlyLitSeries.data.reduce((sum, val) => sum + val, 0)
      : 0;
    const totalAccidents = wellLitTotal + poorlyLitTotal;

    const wellLitAverage = wellLitSeries
      ? Math.round(wellLitTotal / wellLitSeries.data.length)
      : 0;
    const poorlyLitAverage = poorlyLitSeries
      ? Math.round(poorlyLitTotal / poorlyLitSeries.data.length)
      : 0;

    const wellLitMax = wellLitSeries ? Math.max(...wellLitSeries.data) : 0;
    const poorlyLitMax = poorlyLitSeries
      ? Math.max(...poorlyLitSeries.data)
      : 0;

    const wellLitMin = wellLitSeries ? Math.min(...wellLitSeries.data) : 0;
    const poorlyLitMin = poorlyLitSeries
      ? Math.min(...poorlyLitSeries.data)
      : 0;

    const wellLitMaxIndex = wellLitSeries
      ? wellLitSeries.data.indexOf(wellLitMax)
      : -1;
    const poorlyLitMaxIndex = poorlyLitSeries
      ? poorlyLitSeries.data.indexOf(poorlyLitMax)
      : -1;

    const wellLitPercentage =
      totalAccidents > 0
        ? Math.round((wellLitTotal / totalAccidents) * 100)
        : 0;
    const poorlyLitPercentage =
      totalAccidents > 0
        ? Math.round((poorlyLitTotal / totalAccidents) * 100)
        : 0;

    return {
      totalAccidents,
      wellLitTotal,
      poorlyLitTotal,
      wellLitAverage,
      poorlyLitAverage,
      wellLitMax,
      poorlyLitMax,
      wellLitMin,
      poorlyLitMin,
      wellLitMaxPeriod:
        wellLitMaxIndex >= 0 ? chartData.categories[wellLitMaxIndex] : "نامشخص",
      poorlyLitMaxPeriod:
        poorlyLitMaxIndex >= 0
          ? chartData.categories[poorlyLitMaxIndex]
          : "نامشخص",
      wellLitPercentage,
      poorlyLitPercentage,
      periods: chartData.categories.length,
      riskRatio:
        poorlyLitTotal > 0
          ? Math.round((poorlyLitTotal / wellLitTotal) * 100) / 100
          : 0,
    };
  };

  const stats = getStatistics();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <ChartNavigation
        currentSection="temporal"
        currentChart="night-analytics"
      />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              enabledFilters={ENABLED_FILTERS}
              title="فیلترهای تحلیل شبانه"
              description="برای تحلیل دقیق تصادفات شبانه، فیلترهای مورد نظر را اعمال کنید"
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
                  مقایسه زمانی تصادفات در شب
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل مقایسه‌ای تصادفات شبانه بر اساس شرایط روشنایی محل حادثه
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
                {isDemoMode && (
                  <button
                    onClick={() => {
                      setIsDemoMode(false);
                      setChartData(null);
                      handleLoadData();
                    }}
                    className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
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
                        d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    تلاش مجدد API
                  </button>
                )}
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
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

            {/* Demo Mode Warning */}
            {isDemoMode && chartData && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="font-medium text-yellow-800">حالت نمایشی</h3>
                </div>
                <p className="text-sm text-yellow-700">
                  در حال نمایش داده‌های نمونه - اتصال به API برقرار نشد. برای
                  دریافت داده‌های واقعی، دکمه &quot;تلاش مجدد API&quot; را فشار
                  دهید.
                </p>
              </div>
            )}

            {/* Success Message with Statistics */}
            {chartData && !isLoading && !isDemoMode && stats && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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
                  تحلیل {stats.periods} دوره زمانی با مجموع{" "}
                  {stats.totalAccidents.toLocaleString("fa-IR")} تصادف شبانه -
                  با روشنایی کافی: {stats.wellLitPercentage}% - بدون روشنایی
                  کافی: {stats.poorlyLitPercentage}%
                </p>
              </div>
            )}
          </div>

          {/* Main Chart */}
          <div className="space-y-6 mt-6">
            <TemporalNightChart data={chartData} isLoading={isLoading} />

            {/* Initial Instructions */}
            {!chartData && !isLoading && !error && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-blue-600 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">
                      راهنمای استفاده
                    </h3>
                    <ul className="space-y-1 text-sm text-blue-700">
                      <li>
                        • از دکمه &quot;بارگذاری مجدد&quot; برای دریافت آخرین
                        داده‌ها استفاده کنید
                      </li>
                      <li>
                        • این تحلیل فقط تصادفات شبانه را بر اساس شرایط روشنایی
                        مقایسه می‌کند
                      </li>
                      <li>
                        • می‌توانید از فیلترهای جانبی برای انتخاب بازه زمانی و
                        معیارهای مورد نظر استفاده کنید
                      </li>
                      <li>
                        • نمودار خطی به‌خوبی روند تغییرات در طول زمان را نشان
                        می‌دهد
                      </li>
                      <li>
                        • برای مشاهده جزئیات بیشتر، روی نقاط نمودار کلیک کنید
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Analytics Panel */}
            {chartData && stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lighting Analysis */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                    تحلیل شرایط روشنایی
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">کل تصادفات شبانه:</span>
                      <span className="font-semibold text-gray-900">
                        {stats.totalAccidents.toLocaleString("fa-IR")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">با روشنایی کافی:</span>
                      <span className="font-semibold text-orange-600">
                        {stats.wellLitTotal.toLocaleString("fa-IR")} (
                        {stats.wellLitPercentage}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">بدون روشنایی کافی:</span>
                      <span className="font-semibold text-gray-800">
                        {stats.poorlyLitTotal.toLocaleString("fa-IR")} (
                        {stats.poorlyLitPercentage}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">نسبت ریسک:</span>
                      <span
                        className={`font-semibold ${stats.riskRatio > 1 ? "text-red-600" : stats.riskRatio < 1 ? "text-green-600" : "text-gray-600"}`}
                      >
                        {stats.riskRatio.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statistical Insights */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    آمار تفصیلی
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">میانگین با روشنایی:</span>
                      <span className="font-semibold text-orange-600">
                        {stats.wellLitAverage.toLocaleString("fa-IR")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        میانگین بدون روشنایی:
                      </span>
                      <span className="font-semibold text-gray-800">
                        {stats.poorlyLitAverage.toLocaleString("fa-IR")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">پیک با روشنایی:</span>
                      <span className="font-semibold text-orange-600">
                        {stats.wellLitMax.toLocaleString("fa-IR")} (
                        {stats.wellLitMaxPeriod})
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">پیک بدون روشنایی:</span>
                      <span className="font-semibold text-gray-800">
                        {stats.poorlyLitMax.toLocaleString("fa-IR")} (
                        {stats.poorlyLitMaxPeriod})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Safety Recommendations */}
            {chartData && stats && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
                <h3 className="font-medium text-orange-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  توصیه‌های ایمنی
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white bg-opacity-50 rounded-lg p-4">
                    <h4 className="font-medium text-orange-800 mb-2">
                      تحلیل وضعیت
                    </h4>
                    <ul className="space-y-1 text-orange-700">
                      {stats.poorlyLitPercentage > stats.wellLitPercentage ? (
                        <>
                          <li>• تصادفات در نبود روشنایی کافی بیشتر است</li>
                          <li>• نیاز فوری به بهبود روشنایی معابر</li>
                          <li>• اولویت‌بندی مناطق پرخطر</li>
                        </>
                      ) : (
                        <>
                          <li>• تصادفات در حضور روشنایی کافی بیشتر است</li>
                          <li>• بررسی عوامل دیگر مؤثر در تصادفات</li>
                          <li>• توجه به سرعت و رفتار رانندگان</li>
                        </>
                      )}
                    </ul>
                  </div>
                  <div className="bg-white bg-opacity-50 rounded-lg p-4">
                    <h4 className="font-medium text-orange-800 mb-2">
                      اقدامات پیشنهادی
                    </h4>
                    <ul className="space-y-1 text-orange-700">
                      <li>• نصب و بهبود روشنایی معابر</li>
                      <li>• آموزش ایمنی رانندگی شبانه</li>
                      <li>• نظارت بیشتر در ساعات شب</li>
                      <li>• بهبود علائم ترافیکی با قابلیت بازتاب</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Seasonal Pattern Analysis */}
            {chartData && stats && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-medium text-blue-800 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  تحلیل الگوهای زمانی
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-white bg-opacity-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-800">
                      {stats.totalAccidents.toLocaleString("fa-IR")}
                    </div>
                    <div className="text-blue-600">کل تصادفات شبانه</div>
                  </div>
                  <div className="text-center p-3 bg-white bg-opacity-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">
                      {stats.wellLitPercentage}%
                    </div>
                    <div className="text-blue-600">با روشنایی کافی</div>
                  </div>
                  <div className="text-center p-3 bg-white bg-opacity-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-800">
                      {stats.poorlyLitPercentage}%
                    </div>
                    <div className="text-blue-600">بدون روشنایی کافی</div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-blue-700">
                    {stats.poorlyLitPercentage > stats.wellLitPercentage
                      ? "کمبود روشنایی یکی از عوامل اصلی تصادفات شبانه است"
                      : "عوامل دیگری غیر از روشنایی در تصادفات شبانه مؤثر هستند"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalNightAnalyticsPage;
