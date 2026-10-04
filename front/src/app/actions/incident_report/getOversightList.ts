"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { unwrapApiResponse } from "@/utils/api-response";
import type { ReqType } from "@/types/declarations/selectInp";
import type {
  OversightFilters,
  OversightRow,
} from "@/services/report-sources";

type Act = ReqType["main"]["incident_report"]["getOversightList"];

/**
 * The organization's accidents and reports in one list.
 *
 * Filtering and paging are the backend's job here. The console this replaces
 * fetched a capped set and filtered it in the browser, which is why it went
 * quietly blank the moment a filter stopped matching: a client-side filter over
 * 200 rows cannot express "these 52,000 reports, page 4".
 *
 * Request keys are camelCase (`syncStatus`, `reviewStatus`) — the same casing as
 * the sibling console act `accident.dashboard`. Superstruct validates `set`
 * strictly, so a snake_case key is an unknown key and comes back as a validation
 * error rather than as an ignored filter.
 */
export async function fetchOversightList(filters: OversightFilters = {}): Promise<{
  rows: OversightRow[];
  total: number;
}> {
  const token = (await cookies()).get("token");

  // Annotated rather than passed inline: `send` infers its `set` type from the
  // argument, and an inferred type parameter accepts any extra key — so a
  // snake_case `sync_status` would compile and then come back as a validation
  // error from Superstruct. Naming the type makes the object literal checked.
  const set: Act["set"] = {
    organizationId: filters.organizationId,
    page: filters.page ?? 1,
    limit: filters.limit ?? 25,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    groupKeys: filters.groupKeys,
    syncStatus: filters.syncStatus,
    reviewStatus: filters.reviewStatus,
    officerIds: filters.officerIds,
    appVersions: filters.appVersions,
    unlinkedOnly: filters.unlinkedOnly,
    search: filters.search,
  };

  const response = await AppApi().send(
    {
      service: "main",
      model: "incident_report",
      act: "getOversightList",
      details: {
        set,
        // The act's `get` is `object({})` on purpose — the projection is built in
        // the pipeline and a client cannot widen it.
        get: {},
      },
    },
    { token: token?.value },
  );

  // A failure throws rather than resolving to an empty list: the console this
  // replaces already had a silent-blank failure mode, and an empty table that
  // means "no reports match" is indistinguishable from one that means "the request
  // was rejected". `unwrapApiResponse` carries the backend's own Persian message,
  // which `getPatrolErrorMessage` already maps for the UI.
  //
  // The generic says `| undefined` on purpose: `unwrapApiResponse` hands back
  // whatever `body` held, and `success: true` with no body at all is a real
  // answer, not a failure. Without it `body.rows` is a `TypeError` on that reply —
  // the exact silent-blank mode the comment above rejects, reached by a different
  // road.
  const body = unwrapApiResponse<
    { rows?: OversightRow[]; total?: number } | undefined
  >(response);
  return { rows: body?.rows ?? [], total: body?.total ?? 0 };
}