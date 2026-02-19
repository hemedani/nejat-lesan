import {
	checkEnterpriseChartAccess,
	throwUnauthorizedFilterError,
} from "./authorization.ts";
import { coreApp } from "../mod.ts";
import { MyContext } from "./context.ts";

/**
 * Creates a reusable authentication and authorization function for chart endpoints
 * that require enterprise-level access control.
 *
 * @param chartName The name of the chart for access checking and logging
 * @returns A function that performs authentication and authorization checks
 */
export const createChartAuthMiddleware = (
	chartName:
		| "hourlyDayOfWeekAnalytics"
		| "roadDefectsAnalytics"
		| "accidentSeverityAnalytics"
		| "areaUsageAnalytics"
		| "collisionAnalytics"
		| "companyPerformanceAnalytics"
		| "eventCollisionAnalytics"
		| "eventSeverityAnalytics"
		| "spatialCollisionAnalytics"
		| "spatialLightAnalytics"
		| "spatialSeverityAnalytics"
		| "spatialSingleVehicleAnalytics"
		| "spatialSafetyIndexAnalytics"
		| "temporalCollisionAnalytics"
		| "temporalCountAnalytics"
		| "temporalDamageAnalytics"
		| "temporalNightAnalytics"
		| "temporalSeverityAnalytics"
		| "temporalUnlicensedDriversAnalytics"
		| "totalReasonAnalytics"
		| "humanReasonAnalytics"
		| "vehicleReasonAnalytics"
		| "monthlyHolidayAnalytics",
) => {
	return () => {
		// Get user from context
		const { user, body } = coreApp.contextFns
			.getContextModel() as MyContext;

		const details = body?.details!;

		// Check if user has access to this chart based on their settings
		const { hasAccess, defaultFilters, unauthorizedFilters } =
			checkEnterpriseChartAccess(
				user,
				chartName,
				details.set, // Pass the original filters to check access
			);

		if (!hasAccess) {
			if (unauthorizedFilters && unauthorizedFilters.length > 0) {
				throwUnauthorizedFilterError(
					unauthorizedFilters,
					chartName,
				);
			} else {
				throw new Error(
					"Access denied: You don't have permission to view this chart",
				);
			}
		}

		// Apply default filters for enterprise users if they exist
		if (defaultFilters && Object.keys(defaultFilters).length > 0) {
			// Merge default filters with user-provided filters
			for (const [key, value] of Object.entries(defaultFilters)) {
				if (!details.set[key]) {
					details.set[key] = value;
				} else {
					// If user provided filters, intersect them with default filters
					if (
						Array.isArray(details.set[key]) &&
						Array.isArray(value)
					) {
						details.set[key] = details.set[key]
							.filter((
								item: any,
							) => value.includes(item));
					}
				}
			}
		}

		// Ensure only managers and above can access this endpoint
		if (!["Manager", "Enterprise", "Ghost"].includes(user.level!)) {
			throw new Error(
				"Access denied: Insufficient privileges to access this endpoint",
			);
		}
	};
};
