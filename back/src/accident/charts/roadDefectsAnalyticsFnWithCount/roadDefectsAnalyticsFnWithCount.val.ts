/**
 * -----------------------------------------------------------------------------
 * FILE: roadDefectsAnalytics.val.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * The validator for the new endpoint. It accepts the exact same filter set
 * as the main `count` function, allowing the frontend to filter the base
 * data for the chart consistently.
 */
import { array, enums, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";

// This validator is intentionally almost identical to countValidator.
// This ensures that any data filterable in the app can also be applied
// to this chart's data source.
export const roadDefectsAnalyticsWithCountValidator = () => {
	return object({
		set: object({
			// The filter object is the same as countValidator
			// For brevity, only a few are shown here as an example.
			// In your real code, you would copy all fields from countValidator.
			dateOfAccidentFrom: optional(string()),
			dateOfAccidentTo: optional(string()),
			province: optional(string()),
			city: optional(string()),
			polygon: optional(geoJSONStruct("Polygon")),
			// ... include all other filters from your countValidator here
		}),
		get: object({
			defectDistribution: optional(enums([0, 1])),
			defectCounts: optional(enums([0, 1])),
		}),
	});
};
