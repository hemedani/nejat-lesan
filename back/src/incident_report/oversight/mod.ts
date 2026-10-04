import { getOversightListSetup } from "./getOversightList/mod.ts";
import { getOversightStatsSetup } from "./getOversightStats/mod.ts";
import { reviewReportsSetup } from "./reviewReports/mod.ts";

/**
 * The oversight console's server surface.
 *
 * These acts live on `incident_report` because that model owns the shared review
 * lifecycle. They inherit the `incident_patrol` module gate automatically through
 * the `incident_report.*` wildcard in `INCIDENT_SCHEMAS`.
 */
export const oversightSetup = () => {
	getOversightListSetup();
	getOversightStatsSetup();
	reviewReportsSetup();
};
