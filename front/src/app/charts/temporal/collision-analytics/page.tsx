"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import ChartsFilterSidebar, { ChartFilterState } from "@/components/dashboards/ChartsFilterSidebar";
import TemporalCollisionChart from "@/components/charts/TemporalCollisionChart";
import { temporalCollisionAnalytics } from "@/app/actions/accident/temporalCollisionAnalytics";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import { ReqType } from "@/types/declarations/selectInp";
import { useAuth } from "@/context/AuthContext";
import { getEnabledFiltersForChartWithPermissions } from "@/utils/chartFilters";

// Type alias for temporal collision analytics API parameters
type TemporalCollisionApiParams = ReqType["main"]["accident"]["temporalCollisionAnalytics"]["set"];

interface ChartSeries {
  name: string;
  data: number[];
}

interface TemporalCollisionData {
  categories: string[];
  series: ChartSeries[];
}

const TemporalCollisionAnalyticsPage = () => {
  const { enterpriseSettings, userLevel } = useAuth();
  // Get enabled filters for temporal collision analytics considering enterprise settings
  const ENABLED_FILTERS = useMemo(
    () =>
      getEnabledFiltersForChartWithPermissions(
        "TEMPORAL_COLLISION_ANALYTICS",
        userLevel === "Enterprise" ? enterpriseSettings : undefined,
      ),
    [enterpriseSettings, userLevel],
  );

  // Demo data for fallback
  const DEMO_DATA: TemporalCollisionData = useMemo(
    () => ({
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
          name: "سهم از کل تصادفات",
          data: [25.3, 28.1, 22.7, 31.4, 29.8, 26.2, 33.1, 27.9, 24.5, 30.2, 28.7, 32.1],
        },
      ],
    }),
    [],
  );
  interface TemporalCollisionResponse {
    body: {
      analytics: TemporalCollisionData;
    };
    success: boolean;
  }

  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [chartData, setChartData] = useState<TemporalCollisionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ChartFilterState>({});

  // Default collision types as specified in requirements
  const DEFAULT_COLLISION_TYPES = useMemo(
    () => [
      "برخورد وسیله نقلیه با شیء ثابت",
      "واژگونی و سقوط",
      "خروج از جاده",
      "برخورد وسیله نقلیه با یک وسیله نقلیه",
    ],
    [],
  );

  // Get default filters for initial load
  const getDefaultFilters = useCallback((): ChartFilterState => {
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
      lightStatus: [],
      collisionType: DEFAULT_COLLISION_TYPES, // ← CRITICAL: user-selected collision types
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
  }, [DEFAULT_COLLISION_TYPES]);

  // Load initial data on component mount
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setChartData(null);

    try {
      const defaultFilters = getDefaultFilters();

      // Build the initial payload dynamically with only enabled filters
      const initialFilterPayload: Partial<TemporalCollisionApiParams> = {};

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
      const completeInitialPayload = initialFilterPayload as TemporalCollisionApiParams;

      const cleanedParams = Object.fromEntries(
        Object.entries(completeInitialPayload).filter(
          ([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0),
        ),
      );

      const response = (await temporalCollisionAnalytics({
        set: cleanedParams,
        get: { analytics: 1 },
      })) as TemporalCollisionResponse;

      if (response.success && response.body?.analytics) {
        setChartData(response.body.analytics);
        setIsDemoMode(false);
      } else {
        console.warn("[TemporalCollisionAnalytics] API failed, using demo data:", response);
        setChartData(DEMO_DATA);
        setIsDemoMode(true);
        setError(null);
      }
    } catch (err) {
      console.error("[TemporalCollisionAnalytics] Network error, using demo data:", err);
      setChartData(DEMO_DATA);
      setIsDemoMode(true);
      setError(`Network error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }, [getDefaultFilters, DEMO_DATA, ENABLED_FILTERS]);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle filter application
  const handleApplyFilters = async (filters: ChartFilterState) => {
    setIsLoading(true);
    setError(null);
    setChartData(null);
    setAppliedFilters(filters);

    try {
      // Build the payload dynamically, only including enabled filters
      const filterPayload: Partial<TemporalCollisionApiParams> = {};

      // Helper function to check if a filter should be included
      const includeFilter = (filterName: keyof ChartFilterState) => {
        return ENABLED_FILTERS.includes(filterName);
      };

      // --- Core Accident Details ---
      if (includeFilter("seri") && filters.seri !== undefined) filterPayload.seri = filters.seri;
      if (includeFilter("serial") && filters.serial !== undefined)
        filterPayload.serial = filters.serial;
      if (includeFilter("dateOfAccidentFrom") && filters.dateOfAccidentFrom !== undefined)
        filterPayload.dateOfAccidentFrom = filters.dateOfAccidentFrom;
      if (includeFilter("dateOfAccidentTo") && filters.dateOfAccidentTo !== undefined)
        filterPayload.dateOfAccidentTo = filters.dateOfAccidentTo;
      if (includeFilter("deadCount") && filters.deadCount !== undefined)
        filterPayload.deadCount = filters.deadCount;
      if (includeFilter("deadCountMin") && filters.deadCountMin !== undefined)
        filterPayload.deadCountMin = filters.deadCountMin;
      if (includeFilter("deadCountMax") && filters.deadCountMax !== undefined)
        filterPayload.deadCountMax = filters.deadCountMax;
      if (includeFilter("injuredCount") && filters.injuredCount !== undefined)
        filterPayload.injuredCount = filters.injuredCount;
      if (includeFilter("injuredCountMin") && filters.injuredCountMin !== undefined)
        filterPayload.injuredCountMin = filters.injuredCountMin;
      if (includeFilter("injuredCountMax") && filters.injuredCountMax !== undefined)
        filterPayload.injuredCountMax = filters.injuredCountMax;
      if (includeFilter("hasWitness") && filters.hasWitness !== undefined)
        filterPayload.hasWitness = filters.hasWitness;
      if (includeFilter("newsNumber") && filters.newsNumber !== undefined)
        filterPayload.newsNumber = filters.newsNumber;
      if (includeFilter("officer") && filters.officer !== undefined)
        filterPayload.officer = filters.officer;
      if (includeFilter("completionDateFrom") && filters.completionDateFrom !== undefined)
        filterPayload.completionDateFrom = filters.completionDateFrom;
      if (includeFilter("completionDateTo") && filters.completionDateTo !== undefined)
        filterPayload.completionDateTo = filters.completionDateTo;

      // --- Location & Context (multi-select) ---
      if (includeFilter("province") && filters.province !== undefined)
        filterPayload.province = filters.province;
      if (includeFilter("city") && filters.city !== undefined) filterPayload.city = filters.city;
      if (includeFilter("road") && filters.road !== undefined) filterPayload.road = filters.road;
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
      if (includeFilter("roadRepairType") && filters.roadRepairType !== undefined)
        filterPayload.roadRepairType = filters.roadRepairType;
      if (includeFilter("shoulderStatus") && filters.shoulderStatus !== undefined)
        filterPayload.shoulderStatus = filters.shoulderStatus;
      if (includeFilter("areaUsages") && filters.areaUsages !== undefined)
        filterPayload.areaUsages = filters.areaUsages;
      if (includeFilter("airStatuses") && filters.airStatuses !== undefined)
        filterPayload.airStatuses = filters.airStatuses;
      if (includeFilter("roadDefects") && filters.roadDefects !== undefined)
        filterPayload.roadDefects = filters.roadDefects;
      if (includeFilter("humanReasons") && filters.humanReasons !== undefined)
        filterPayload.humanReasons = filters.humanReasons;
      if (includeFilter("vehicleReasons") && filters.vehicleReasons !== undefined)
        filterPayload.vehicleReasons = filters.vehicleReasons;
      if (includeFilter("equipmentDamages") && filters.equipmentDamages !== undefined)
        filterPayload.equipmentDamages = filters.equipmentDamages;
      if (includeFilter("roadSurfaceConditions") && filters.roadSurfaceConditions !== undefined)
        filterPayload.roadSurfaceConditions = filters.roadSurfaceConditions;

      // --- Attachments ---
      if (includeFilter("attachmentName") && filters.attachmentName !== undefined)
        filterPayload.attachmentName = filters.attachmentName;
      if (includeFilter("attachmentType") && filters.attachmentType !== undefined)
        filterPayload.attachmentType = filters.attachmentType;

      // --- Vehicle DTOs Filters ---
      if (includeFilter("vehicleColor") && filters.vehicleColor !== undefined)
        filterPayload.vehicleColor = filters.vehicleColor;
      if (includeFilter("vehicleSystem") && filters.vehicleSystem !== undefined)
        filterPayload.vehicleSystem = filters.vehicleSystem;
      if (includeFilter("vehiclePlaqueType") && filters.vehiclePlaqueType !== undefined)
        filterPayload.vehiclePlaqueType = filters.vehiclePlaqueType;
      if (includeFilter("vehicleSystemType") && filters.vehicleSystemType !== undefined)
        filterPayload.vehicleSystemType = filters.vehicleSystemType;
      if (includeFilter("vehicleFaultStatus") && filters.vehicleFaultStatus !== undefined)
        filterPayload.vehicleFaultStatus = filters.vehicleFaultStatus;
      if (includeFilter("vehicleInsuranceCo") && filters.vehicleInsuranceCo !== undefined)
        filterPayload.vehicleInsuranceCo = filters.vehicleInsuranceCo;
      if (includeFilter("vehicleInsuranceNo") && filters.vehicleInsuranceNo !== undefined)
        filterPayload.vehicleInsuranceNo = filters.vehicleInsuranceNo;
      if (includeFilter("vehiclePlaqueUsage") && filters.vehiclePlaqueUsage !== undefined)
        filterPayload.vehiclePlaqueUsage = filters.vehiclePlaqueUsage;
      if (includeFilter("vehiclePrintNumber") && filters.vehiclePrintNumber !== undefined)
        filterPayload.vehiclePrintNumber = filters.vehiclePrintNumber;
      if (
        includeFilter("vehiclePlaqueSerialElement") &&
        filters.vehiclePlaqueSerialElement !== undefined
      )
        filterPayload.vehiclePlaqueSerialElement = filters.vehiclePlaqueSerialElement;
      if (includeFilter("vehicleInsuranceDateFrom") && filters.vehicleInsuranceDateFrom !== undefined)
        filterPayload.vehicleInsuranceDateFrom = filters.vehicleInsuranceDateFrom;
      if (includeFilter("vehicleInsuranceDateTo") && filters.vehicleInsuranceDateTo !== undefined)
        filterPayload.vehicleInsuranceDateTo = filters.vehicleInsuranceDateTo;
      if (includeFilter("vehicleBodyInsuranceCo") && filters.vehicleBodyInsuranceCo !== undefined)
        filterPayload.vehicleBodyInsuranceCo = filters.vehicleBodyInsuranceCo;
      if (includeFilter("vehicleBodyInsuranceNo") && filters.vehicleBodyInsuranceNo !== undefined)
        filterPayload.vehicleBodyInsuranceNo = filters.vehicleBodyInsuranceNo;
      if (includeFilter("vehicleMotionDirection") && filters.vehicleMotionDirection !== undefined)
        filterPayload.vehicleMotionDirection = filters.vehicleMotionDirection;
      if (includeFilter("vehicleMaxDamageSections") && filters.vehicleMaxDamageSections !== undefined)
        filterPayload.vehicleMaxDamageSections = filters.vehicleMaxDamageSections;
      if (
        includeFilter("vehicleDamageSectionOther") &&
        filters.vehicleDamageSectionOther !== undefined
      )
        filterPayload.vehicleDamageSectionOther = filters.vehicleDamageSectionOther;
      if (
        includeFilter("vehicleInsuranceWarrantyLimit") &&
        filters.vehicleInsuranceWarrantyLimit !== undefined
      )
        filterPayload.vehicleInsuranceWarrantyLimit = filters.vehicleInsuranceWarrantyLimit;
      if (
        includeFilter("vehicleInsuranceWarrantyLimitMin") &&
        filters.vehicleInsuranceWarrantyLimitMin !== undefined
      )
        filterPayload.vehicleInsuranceWarrantyLimitMin = filters.vehicleInsuranceWarrantyLimitMin;
      if (
        includeFilter("vehicleInsuranceWarrantyLimitMax") &&
        filters.vehicleInsuranceWarrantyLimitMax !== undefined
      )
        filterPayload.vehicleInsuranceWarrantyLimitMax = filters.vehicleInsuranceWarrantyLimitMax;

      // --- Driver in Vehicle DTOs Filters ---
      if (includeFilter("driverSex") && filters.driverSex !== undefined)
        filterPayload.driverSex = filters.driverSex;
      if (includeFilter("driverFirstName") && filters.driverFirstName !== undefined)
        filterPayload.driverFirstName = filters.driverFirstName;
      if (includeFilter("driverLastName") && filters.driverLastName !== undefined)
        filterPayload.driverLastName = filters.driverLastName;
      if (includeFilter("driverNationalCode") && filters.driverNationalCode !== undefined)
        filterPayload.driverNationalCode = filters.driverNationalCode;
      if (includeFilter("driverLicenceNumber") && filters.driverLicenceNumber !== undefined)
        filterPayload.driverLicenceNumber = filters.driverLicenceNumber;
      if (includeFilter("driverLicenceType") && filters.driverLicenceType !== undefined)
        filterPayload.driverLicenceType = filters.driverLicenceType;
      if (includeFilter("driverInjuryType") && filters.driverInjuryType !== undefined)
        filterPayload.driverInjuryType = filters.driverInjuryType;
      if (includeFilter("driverTotalReason") && filters.driverTotalReason !== undefined)
        filterPayload.driverTotalReason = filters.driverTotalReason;

      // --- Passenger in Vehicle DTOs Filters ---
      if (includeFilter("passengerSex") && filters.passengerSex !== undefined)
        filterPayload.passengerSex = filters.passengerSex;
      if (includeFilter("passengerFirstName") && filters.passengerFirstName !== undefined)
        filterPayload.passengerFirstName = filters.passengerFirstName;
      if (includeFilter("passengerLastName") && filters.passengerLastName !== undefined)
        filterPayload.passengerLastName = filters.passengerLastName;
      if (includeFilter("passengerNationalCode") && filters.passengerNationalCode !== undefined)
        filterPayload.passengerNationalCode = filters.passengerNationalCode;
      if (includeFilter("passengerInjuryType") && filters.passengerInjuryType !== undefined)
        filterPayload.passengerInjuryType = filters.passengerInjuryType;
      if (includeFilter("passengerFaultStatus") && filters.passengerFaultStatus !== undefined)
        filterPayload.passengerFaultStatus = filters.passengerFaultStatus;
      if (includeFilter("passengerTotalReason") && filters.passengerTotalReason !== undefined)
        filterPayload.passengerTotalReason = filters.passengerTotalReason;

      // --- Pedestrian DTOs Filters ---
      if (includeFilter("pedestrianSex") && filters.pedestrianSex !== undefined)
        filterPayload.pedestrianSex = filters.pedestrianSex;
      if (includeFilter("pedestrianFirstName") && filters.pedestrianFirstName !== undefined)
        filterPayload.pedestrianFirstName = filters.pedestrianFirstName;
      if (includeFilter("pedestrianLastName") && filters.pedestrianLastName !== undefined)
        filterPayload.pedestrianLastName = filters.pedestrianLastName;
      if (includeFilter("pedestrianNationalCode") && filters.pedestrianNationalCode !== undefined)
        filterPayload.pedestrianNationalCode = filters.pedestrianNationalCode;
      if (includeFilter("pedestrianInjuryType") && filters.pedestrianInjuryType !== undefined)
        filterPayload.pedestrianInjuryType = filters.pedestrianInjuryType;
      if (includeFilter("pedestrianFaultStatus") && filters.pedestrianFaultStatus !== undefined)
        filterPayload.pedestrianFaultStatus = filters.pedestrianFaultStatus;
      if (includeFilter("pedestrianTotalReason") && filters.pedestrianTotalReason !== undefined)
        filterPayload.pedestrianTotalReason = filters.pedestrianTotalReason;

      // Now cast to the full type since we know all possible fields are covered
      const completeFilterPayload = filterPayload as TemporalCollisionApiParams;

      // Remove undefined values
      const cleanedParams = Object.fromEntries(
        Object.entries(completeFilterPayload).filter(
          ([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0),
        ),
      );

      const response = (await temporalCollisionAnalytics({
        set: cleanedParams,
        get: { analytics: 1 },
      })) as TemporalCollisionResponse;

      if (response.success && response.body?.analytics) {
        setChartData(response.body.analytics);
        setIsDemoMode(false);
      } else {
        console.warn("[TemporalCollisionAnalytics] API failed, using demo data:", response);
        setChartData(DEMO_DATA);
        setIsDemoMode(true);
        setError(null);
      }
    } catch (err) {
      console.error("[TemporalCollisionAnalytics] Network error, using demo data:", err);
      setChartData(DEMO_DATA);
      setIsDemoMode(true);
      setError(`Network error: ${err instanceof Error ? err.message : "Unknown error"}`);
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
      <ChartNavigation currentSection="temporal" currentChart="collision-analytics" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              enabledFilters={ENABLED_FILTERS}
              title="فیلترهای تحلیل برخورد"
              description="برای مشاهده تحلیل زمانی نحوه و نوع برخورد، فیلترهای مورد نظر را اعمال کنید"
              initialFilters={{
                collisionType: DEFAULT_COLLISION_TYPES,
              }}
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
                <h1 className="text-2xl font-bold text-gray-900">مقایسه زمانی نحوه و نوع برخورد</h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل روند زمانی انواع مختلف برخورد و مقایسه آن‌ها در بازه‌های مختلف
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

          {/* NEW: Standardized Applied Filters Display */}
          <div className="mb-6">
            <AppliedFiltersDisplay filters={appliedFilters} />
          </div>

          {/* Chart */}
          <div className="space-y-6">
            <TemporalCollisionChart
              data={chartData}
              isLoading={isLoading}
              error={error}
              isDemoMode={isDemoMode}
            />

            {/* Chart Statistics */}
            {chartData && chartData.series && chartData.series.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">آمار کلی</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {chartData.categories.length}
                    </div>
                    <div className="text-sm text-blue-700">دوره زمانی</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{chartData.series.length}</div>
                    <div className="text-sm text-green-700">سری داده</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {chartData.series
                        .reduce(
                          (total, series) =>
                            total + series.data.reduce((sum, value) => sum + value, 0),
                          0,
                        )
                        .toFixed(1)}
                      %
                    </div>
                    <div className="text-sm text-purple-700">مجموع سهم</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalCollisionAnalyticsPage;
