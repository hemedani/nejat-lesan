import { array, boolean, objectIdValidation, optional, string } from "@deps";
import {
	incident_report_review_status_emums,
	incident_report_sync_status_emums,
} from "../../../models/incident_report.ts";

/**
 * The console's filter set, as one struct both acts build on.
 *
 * `getOversightList` and `getOversightStats` describe the same population, so
 * they take the same filters. Two hand-written schemas would drift: the first one
 * to gain a filter would have the list honour it while the statistics above the
 * table kept describing every report, which is precisely the disagreement the
 * console's counts are not allowed to have.
 *
 * Status values are constrained to the real enums, as `dashboard.val.ts` does: a
 * typo must be a validation error, not an empty list that reads as "nothing
 * matches".
 */
export const oversightFilterStruct = () => ({
	organizationId: optional(objectIdValidation),
	// The local-day window, read by `sharedMatch`'s `sortAtRange` on both sides.
	dateFrom: optional(string()),
	dateTo: optional(string()),
	/** `accident`, or form definition ids. */
	groupKeys: optional(array(string())),
	syncStatus: optional(array(incident_report_sync_status_emums)),
	reviewStatus: optional(array(incident_report_review_status_emums)),
	officerIds: optional(array(objectIdValidation)),
	appVersions: optional(array(string())),
	unlinkedOnly: optional(boolean()),
	search: optional(string()),
});
