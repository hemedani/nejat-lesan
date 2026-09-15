/**
 * -----------------------------------------------------------------------------
 * FILE: accidentScope.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Chart-local entry point for the "accidents only" base filter.
 *
 * The canonical definition — and the full explanation of why a plain
 * `incident_type: "accident"` equality silently wipes out every legacy accident
 * (and therefore every chart) — lives in `utils/incidentTypeFilter.ts`.
 * This module simply re-exports it so the 25 chart modules can keep importing
 * from their own directory without a duplicate `@lib` import statement.
 *
 * Usage:
 *     const baseFilter: Document = {
 *         ...accidentOnlyFilter,
 *         date_of_accident: { $gte: startDate, $lte: endDate },
 *     };
 */
export { accidentOnlyFilter } from "@lib";
