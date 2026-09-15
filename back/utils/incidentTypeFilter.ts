/**
 * -----------------------------------------------------------------------------
 * FILE: incidentTypeFilter.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Single source of truth for how `accident.incident_type` is queried.
 *
 * WHY THIS EXISTS (do not "simplify" these back to a plain equality match):
 *
 * `incident_type` is the discriminator of the polymorphic incident report model
 * — "accident" | "road_breakdown" | "road_obstacle" | "other". It was introduced
 * *after* the historic accident corpus already existed, so every legacy document
 * has no `incident_type` field at all. The model contract is explicit about this
 * (see `models/accident.ts`):
 *
 *     // Discriminator: "accident" (default when absent) | ...
 *     // Legacy docs without it are accidents.
 *
 * A plain `incident_type: "accident"` equality therefore silently drops the
 * entire legacy corpus — charts returned 0 / [] while still answering HTTP 200,
 * and "filter by type = accident" lists came back empty.
 *
 * `$in: ["accident", null]` is the correct expression of that contract:
 *   - `"accident"` → reports explicitly labelled as accidents
 *   - `null`       → matches BOTH an explicit null AND a missing field, i.e. the
 *                    legacy corpus, which is accidents by definition
 *
 * while still excluding the newer non-accident report types.
 */
import type { Document } from "@deps";

/** Matches every accident, including legacy docs that predate `incident_type`. */
export const accidentOnlyFilter: Document = {
	incident_type: { $in: ["accident", null] },
};

/**
 * Builds the filter fragment for an explicit incident-type selection.
 *
 * Only `"accident"` has a legacy equivalent: asking for a non-accident type must
 * keep matching that type exactly, because no legacy doc could ever be one.
 *
 * @param incidentType One of the `incident_type` enum values.
 */
export const incidentTypeFilter = (incidentType: string): Document =>
	incidentType === "accident"
		? { ...accidentOnlyFilter }
		: { incident_type: incidentType };
