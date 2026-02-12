"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import ChartNavigation from "@/components/navigation/ChartNavigation";
import ChartsFilterSidebar, { ChartFilterState } from "@/components/dashboards/ChartsFilterSidebar";
import { getEnabledFiltersForChartWithPermissions } from "@/utils/chartFilters";
import AppliedFiltersDisplay from "@/components/dashboards/AppliedFiltersDisplay";
import TemporalSeverityChart from "@/components/charts/TemporalSeverityChart";
import { temporalSeverityAnalytics } from "@/app/actions/accident/temporalSeverityAnalytics";
import { ReqType } from "@/types/declarations/selectInp";
import { useAuth } from "@/context/AuthContext";

const TemporalSeverityAnalyticsPage = () => {
  const { enterpriseSettings, userLevel } = useAuth();
  // Get enabled filters for temporal severity analytics considering enterprise settings
  const ENABLED_FILTERS = useMemo(
    () =>
      getEnabledFiltersForChartWithPermissions(
        "TEMPORAL_SEVERITY_ANALYTICS",
        userLevel === "Enterprise" ? enterpriseSettings : undefined,
      ),
    [enterpriseSettings, userLevel],
  );

  interface ChartSeries {
    name: string;
    data: number[];
  }

  interface TemporalSeverityData {
    categories: string[];
    series: ChartSeries[];
  }

  interface TemporalSeverityResponse {
    body: {
      analytics: TemporalSeverityData;
    };
    success: boolean;
  }

  const [showFilterSidebar, setShowFilterSidebar] = useState(true);
  const [chartData, setChartData] = useState<TemporalSeverityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ChartFilterState>({});

  // Demo data for fallback
  const DEMO_DATA: TemporalSeverityData = useMemo(
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
          name: "سهم تصادفات فوتی از شدید",
          data: [12.5, 15.3, 18.2, 14.7, 16.8, 13.4, 19.1, 17.6, 15.9, 14.2, 16.3, 13.8],
        },
      ],
    }),
    [],
  );

  // Get default filters for initial load
  const getDefaultFilters = (): ChartFilterState => {
    return {
      province: [],
      city: [],
      dateOfAccidentFrom: undefined,
      dateOfAccidentTo: undefined,
      lightStatus: [],
      collisionType: [],
      roadDefects: [],
      airStatuses: [],
      areaUsages: [],
      roadSurfaceConditions: [],
      deadCountMin: undefined,
      deadCountMax: undefined,
      injuredCountMin: undefined,
      injuredCountMax: undefined,
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
        ReqType["main"]["accident"]["temporalSeverityAnalytics"]["set"]
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
        initialFilterPayload as ReqType["main"]["accident"]["temporalSeverityAnalytics"]["set"];

      const cleanedParams = Object.fromEntries(
        Object.entries(completeInitialPayload).filter(
          ([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0),
        ),
      );

      const response = (await temporalSeverityAnalytics({
        set: cleanedParams,
        get: { analytics: 1 },
      })) as TemporalSeverityResponse;

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
  }, [ENABLED_FILTERS, DEMO_DATA]);

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
      const filterPayload: Partial<ReqType["main"]["accident"]["temporalSeverityAnalytics"]["set"]> =
        {};

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
      const completeFilterPayload =
        filterPayload as ReqType["main"]["accident"]["temporalSeverityAnalytics"]["set"];

      // Remove undefined values
      const cleanedParams = Object.fromEntries(
        Object.entries(completeFilterPayload).filter(
          ([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0),
        ),
      );

      const response = (await temporalSeverityAnalytics({
        set: cleanedParams,
        get: { analytics: 1 },
      })) as TemporalSeverityResponse;

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
      disableLightingFilter: false,
      lockToSevereAccidents: true, // Lock to severe accidents for severity analysis
    };
  };

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Calculate statistics
  const getStatistics = () => {
    if (!chartData || !chartData.series?.[0]?.data) return null;

    const data = chartData.series[0].data;
    const total = data.reduce((sum, val) => sum + val, 0);
    const average = total / data.length;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const maxIndex = data.indexOf(max);
    const minIndex = data.indexOf(min);

    return {
      average: Number(average.toFixed(2)),
      max: Number(max.toFixed(2)),
      min: Number(min.toFixed(2)),
      maxPeriod: chartData.categories[maxIndex],
      minPeriod: chartData.categories[minIndex],
      periods: chartData.categories.length,
      range: Number((max - min).toFixed(2)),
    };
  };

  const stats = getStatistics();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <ChartNavigation currentSection="temporal" currentChart="severity-analytics" />

      <div className="flex">
        {/* Filter Sidebar */}
        {showFilterSidebar && (
          <div className="w-80 flex-shrink-0">
            <ChartsFilterSidebar
              onApplyFilters={handleApplyFilters}
              config={getFilterConfig()}
              enabledFilters={ENABLED_FILTERS}
              title="فیلترهای تحلیل سهم تصادفات فوتی"
              description="برای تحلیل سهم تصادفات فوتی از تصادفات شدید، فیلترهای مورد نظر خود را اعمال کنید"
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
                  مقایسه زمانی سهم تصادفات فوتی از تصادفات شدید
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  تحلیل روند درصد تصادفات فوتی در بین تصادفات شدید در بازه‌های زمانی مختلف
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLoadData}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="mb-6">
            <AppliedFiltersDisplay filters={appliedFilters} />
          </div>

          {/* Chart */}
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
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
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="font-medium text-yellow-800">حالت نمایشی</h3>
                </div>
                <p className="text-sm text-yellow-700">
                  در حال نمایش داده‌های نمونه - اتصال به API برقرار نشد. برای دریافت داده‌های واقعی،
                  دکمه &quot;تلاش مجدد API&quot; را فشار دهید.
                </p>
              </div>
            )}

            {/* Success Message with Statistics */}
            {chartData && !isLoading && !isDemoMode && stats && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="font-medium text-green-800">داده‌ها بارگذاری شد</h3>
                </div>
                <p className="text-sm text-green-700">
                  تحلیل {stats.periods} دوره زمانی - میانگین: {stats.average}% - حداکثر: {stats.max}% (
                  {stats.maxPeriod}) - حداقل: {stats.min}% ({stats.minPeriod}) - محدوده نوسان:{" "}
                  {stats.range}%
                </p>
              </div>
            )}
          </div>

          {/* Main Chart */}
          <div className="space-y-6 mt-6">
            <TemporalSeverityChart data={chartData} isLoading={isLoading} />

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
                    <h3 className="font-medium text-blue-800 mb-2">راهنمای استفاده</h3>
                    <ul className="space-y-1 text-sm text-blue-700">
                      <li>
                        • از دکمه &quot;بارگذاری مجدد&quot; برای دریافت آخرین داده‌ها استفاده کنید
                      </li>
                      <li>
                        • از فیلترهای جانبی برای انتخاب بازه زمانی و معیارهای مورد نظر استفاده کنید
                      </li>
                      <li>• این تحلیل درصد تصادفات فوتی را در بین تصادفات شدید نشان می‌دهد</li>
                      <li>• می‌توانید چندین استان یا شهر را همزمان انتخاب کنید</li>
                      <li>• نمودار به صورت خودکار بر اساس فیلترهای اعمال شده به‌روزرسانی می‌شود</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Analytics Panel */}
            {chartData && stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart Features */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
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
                    ویژگی‌های نمودار
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">امکان زوم و پن</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">دانلود نمودار</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">نمایش جزئیات</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">طراحی واکنش‌گرا</span>
                    </div>
                  </div>
                </div>

                {/* Data Insights */}
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
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    بینش‌های داده
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">میانگین سهم:</span>
                      <span className="font-semibold text-gray-900">{stats.average}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">بیشترین سهم:</span>
                      <span className="font-semibold text-red-600">
                        {stats.max}% ({stats.maxPeriod})
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">کمترین سهم:</span>
                      <span className="font-semibold text-green-600">
                        {stats.min}% ({stats.minPeriod})
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">محدوده نوسان:</span>
                      <span className="font-semibold text-gray-900">{stats.range}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">تعداد دوره‌ها:</span>
                      <span className="font-semibold text-gray-900">{stats.periods}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations Panel */}
            {chartData && stats && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-medium text-blue-900 mb-4 flex items-center gap-2">
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
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  توصیه‌های تحلیلی
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white bg-opacity-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">الگوهای شدت</h4>
                    <ul className="space-y-1 text-blue-700">
                      <li>• دوره {stats.maxPeriod} دارای بیشترین سهم تصادفات فوتی است</li>
                      <li>• دوره {stats.minPeriod} دارای کمترین سهم تصادفات فوتی است</li>
                      <li>• نوسان شدت: {stats.range} درصد</li>
                    </ul>
                  </div>
                  <div className="bg-white bg-opacity-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">اقدامات پیشنهادی</h4>
                    <ul className="space-y-1 text-blue-700">
                      <li>• تمرکز بر دوره‌های پرخطر</li>
                      <li>• بررسی عوامل مؤثر در کاهش شدت</li>
                      <li>• برنامه‌ریزی برای کنترل شدت تصادفات</li>
                    </ul>
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

export default TemporalSeverityAnalyticsPage;
