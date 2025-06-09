"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const getCounts = async () => {
  const token = (await cookies()).get("token"); // Note: cookies() itself is not a promise
  const getCountDashboard = await AppApi().send(
    {
      service: "main",
      model: "user", // This likely refers to the service/model handling the 'dashboardStatistic' action
      act: "dashboardStatistic",
      details: {
        set: {}, // This section remains as per your original snippet
        get: {
          // Existing fields
          users: 1,
          provinces: 1,
          cities: 1,

          // Added fields to request all counts
          accidents: 1,
          airStatuses: 1,
          areaUsages: 1,
          bodyInsuranceCos: 1,
          collisionTypes: 1,
          colors: 1,
          equipmentDamages: 1,
          faultStatuses: 1,
          humanReasons: 1,
          insuranceCos: 1,
          licenceTypes: 1,
          lightStatuses: 1,
          maxDamageSections: 1,
          motionDirections: 1,
          plaqueTypes: 1,
          plaqueUsages: 1,
          positions: 1,
          roads: 1,
          roadDefects: 1,
          roadRepairTypes: 1,
          roadSituations: 1,
          roadSurfaceConditions: 1,
          rulingTypes: 1,
          shoulderStatuses: 1,
          systems: 1,
          systemTypes: 1,
          types: 1,
          vehicleReasons: 1,
        },
      },
    },
    { token: token?.value }
  );

  if (getCountDashboard.success) {
    return getCountDashboard.body;
  }
  // Consider handling the case where getCountDashboard.success is false,
  // e.g., by returning null, undefined, or throwing an error,
  // depending on how your application expects to handle API errors.
  // For now, it implicitly returns undefined if not successful.
};
