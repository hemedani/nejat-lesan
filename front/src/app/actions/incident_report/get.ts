"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

/**
 * Read one non-accident report.
 *
 * The `incident_report` twin of `accident/get`: the oversight console lists both
 * models as one table, so opening a row must be able to reach either collection.
 * The two models do not share a field list, so the caller supplies the projection
 * rather than getting a merged one — `accident.get`'s validator accepts `serial` and
 * `collision_type`, which `incident_report.get` rejects as unknown keys.
 */
export const getIncidentReport = async (
  _id: string,
  get?: ReqType["main"]["incident_report"]["get"]["get"],
) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "incident_report",
      act: "get",
      details: {
        set: {
          _id,
        },
        get: {
          _id: 1,
          report_id: 1,
          ...get,
        },
      },
    },
    { token: token?.value },
  );
};