import { Infer, object } from "@deps";
import { throwError, UserPure } from "@lib";
import { availableCharts } from "@model";

// Infer the type for available charts from the user model
type AvailableChartsType = Infer<typeof availableCharts>;

/**
 * Throws an error for unauthorized filter access
 */
export const throwUnauthorizedFilterError = (
	unauthorizedFilters: string[],
	chartName: string,
) => {
	const message = `Unauthorized access to filters: [${
		unauthorizedFilters.join(", ")
	}] for chart: ${chartName}`;
	throwError(message);
};

/**
 * Checks if the user has access to the requested chart based on their settings
 * and applies default filters for province and city if needed.
 */
export const checkEnterpriseChartAccess = (
	user: Partial<UserPure>,
	chartName: keyof NonNullable<AvailableChartsType>,
	requestedFilters?: Record<string, any>,
): {
	hasAccess: boolean;
	defaultFilters?: Record<string, any>;
	unauthorizedFilters?: string[];
} => {
	// Only check settings for enterprise users
	if (user.level !== "Enterprise") {
		return { hasAccess: true }; // Managers and other levels have full access
	}

	// Clean filters by removing empty arrays and strings - modifies the original object
	if (requestedFilters) {
		for (const [key, value] of Object.entries(requestedFilters)) {
			if (
				(Array.isArray(value) && value.length === 0) ||
				value === "" ||
				(typeof value === "object" && value !== null &&
					Object.keys(value).length === 0)
			) {
				delete requestedFilters[key];
			}
		}
	}

	// Check if the chart is available in user's settings
	// availableCharts is an object, not an array
	const availableChartsValue = user.settings
		?.availableCharts as AvailableChartsType;

	if (availableChartsValue && !availableChartsValue[chartName]) {
		return { hasAccess: false };
	}

	// Check if the user has access to the specific filters they're requesting
	const unauthorizedFilters: string[] = [];
	if (
		requestedFilters && availableChartsValue &&
		availableChartsValue[chartName]
	) {
		const allowedFilters = availableChartsValue[chartName];

		for (const filterName in requestedFilters) {
			// Check if the filter is allowed for this chart
			if (!allowedFilters || !(filterName in allowedFilters)) {
				unauthorizedFilters.push(filterName);
			} else {
				// Check if the specific filter is enabled (true)
				const filterEnabled = (allowedFilters as any)[filterName];
				if (!filterEnabled) {
					unauthorizedFilters.push(filterName);
				}
			}
		}
	}

	// Prepare default filters based on user's allowed provinces and cities
	const defaultFilters: Record<string, any> = {};

	if (user.settings?.provinces && user.settings.provinces.length > 0) {
		defaultFilters.province = user.settings.provinces.map((p) => p.name);
	}

	if (user.settings?.cities && user.settings.cities.length > 0) {
		defaultFilters.city = user.settings.cities.map((c) => c.name);
	}

	if (unauthorizedFilters.length > 0) {
		return { hasAccess: false, defaultFilters, unauthorizedFilters };
	}

	return { hasAccess: true, defaultFilters };
};

/**
 * Validator for preValidation middleware that checks enterprise access
 * and modifies the request with default filters if needed.
 */
export const enterpriseAccessValidator = (chartName: string) => {
	return object({
		set: object({
			// We'll validate the user context separately in the middleware
		}),
		get: object({
			// Get parameters remain the same
		}),
	});
};
