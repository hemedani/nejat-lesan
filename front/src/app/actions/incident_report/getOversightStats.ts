"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { unwrapApiResponse } from "@/utils/api-response";
import type { ReqType } from "@/types/declarations/selectInp";
import type { OversightFilters, OversightStats } from "@/services/report-sources";

type Act = ReqType["main"]["incident_report"]["getOversightStats"];

/**
 * The filters this act takes: the console's, minus the two only a list has.
 *
 * `Omit` rather than `OversightFilters & { thresholdHours?: number }`, which would
 * keep advertising `page` and `limit` in the signature while the `set` built below
 * silently dropped them. A count has no page, so a caller who passed one would get
 * counts that quietly ignored it — and this act's whole job is for the numbers above
 * the table to describe the table.
 */
type StatsFilters = Omit<OversightFilters, "page" | "limit"> & {
  thresholdHours?: number;
};

/**
 * The three statistics blocks above the oversight table.
 *
 * Takes the list's whole filter surface, not a date range and a threshold. These
 * counts sit directly above the rows `fetchOversightList` returns, so a filter the
 * list honours and these ignore leaves the two visibly disagreeing — which is how
 * a console ends up claiming nothing is stuck while the table is full of reports
 * that have been queued for three days.
 *
 * Request keys are camelCase, matching `getOversightList` and `accident.dashboard`.
 */
export async function fetchOversightStats(
  filters: StatsFilters = {},
): Promise<OversightStats> {
  const token = (await cookies()).get("token");

  // Annotated rather than passed inline: `send` infers its `set` type from the
  // argument, and an inferred type parameter accepts any extra key — so a
  // snake_case `sync_status` would compile and then come back as a validation
  // error from Superstruct. Naming the type makes the object literal checked.
  const set: Act["set"] = {
    organizationId: filters.organizationId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    groupKeys: filters.groupKeys,
    syncStatus: filters.syncStatus,
    reviewStatus: filters.reviewStatus,
    officerIds: filters.officerIds,
    appVersions: filters.appVersions,
    unlinkedOnly: filters.unlinkedOnly,
    search: filters.search,
    thresholdHours: filters.thresholdHours,
  };

  const response = await AppApi().send(
    {
      service: "main",
      model: "incident_report",
      act: "getOversightStats",
      details: { set, get: {} },
    },
    { token: token?.value },
  );

  // Throws on failure rather than reporting zeroes: a statistics panel that answers
  // "nothing is stuck" because the request failed is worse than an error box.
  //
  // `| undefined` for the same reason as the sibling list act — a `success: true`
  // reply with no body is a real answer, and reading a field off `undefined` would
  // throw past the error path instead of degrading.
  const body = unwrapApiResponse<Partial<OversightStats> | undefined>(response);

  return {
    byOfficer: body?.byOfficer ?? [],
    byAppVersion: body?.byAppVersion ?? [],
    aging: body?.aging ?? {
      queued: 0,
      under_review: 0,
      thresholdHours: filters.thresholdHours ?? 24,
    },
  };
}