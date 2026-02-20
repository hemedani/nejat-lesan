import { ObjectId } from "@deps";
import { coreApp } from "../mod.ts";
import { MyContext } from "./context.ts";
import { throwError } from "./throwError.ts";

/**
 * Creates an authentication and authorization middleware for province gets endpoint
 * that restricts Enterprise users to only access provinces from their settings.
 *
 * For Enterprise users:
 * - Must have settings.provinces configured
 * - Can only access provinces in their settings.provinces list
 *
 * @returns A function that performs authentication and authorization checks
 */
export const createProvinceGetsAuthMiddleware = () => {
	return () => {
		// Get user from context
		const { user, body } = coreApp.contextFns
			.getContextModel() as MyContext;

		const details = body?.details!;

		// Ensure only managers and above can access this endpoint
		if (!["Manager", "Enterprise", "Ghost"].includes(user.level!)) {
			throwError(
				"Access denied: Insufficient privileges to access this endpoint",
			);
		}

		// Only apply restrictions for Enterprise users
		// Manager and Ghost users have full access
		if (user.level !== "Enterprise") {
			return;
		}

		// Initialize details.set if not present
		if (!details.set) {
			details.set = {};
		}

		// Check if user has provinces-based access
		const hasProvinceAccess = user.settings?.provinces &&
			user.settings.provinces.length > 0;

		// Enterprise user must have provinces configured
		if (!hasProvinceAccess) {
			throwError(
				"Access denied: You don't have permission to access any provinces",
			);
		}

		// Collect allowed province IDs from user settings
		const allowedProvinceIds: ObjectId[] = user.settings!.provinces!.map(
			(province) => new ObjectId(province._id),
		);

		// If user provided _ids filter, validate it
		if (details.set._ids && details.set._ids.length > 0) {
			const requestedIds = details.set._ids.map(
				(id: string | ObjectId) => new ObjectId(id),
			);
			const allowedIdsSet = new Set(
				allowedProvinceIds.map((id) => id.toString()),
			);

			// Filter to only include provinces the user has access to
			const filteredIds = requestedIds.filter((id: ObjectId) =>
				allowedIdsSet.has(id.toString())
			);

			if (filteredIds.length === 0) {
				throwError(
					"Access denied: You don't have permission to access the requested provinces",
				);
			}

			details.set._ids = filteredIds;
		} else {
			// No _ids provided, set to all allowed provinces
			details.set._ids = allowedProvinceIds;
		}
	};
};

/**
 * Creates an authentication and authorization middleware for city gets endpoint
 * that restricts Enterprise users to only access cities within their allowed
 * provinces OR cities from their settings.
 *
 * For Enterprise users, cities are accessible based on EITHER:
 * - settings.provinces: Access to all cities within these provinces, OR
 * - settings.cities: Access to only these specific cities
 * (These are mutually exclusive - user cannot have both at the same time)
 *
 * @returns A function that performs authentication and authorization checks
 */
export const createCityGetsAuthMiddleware = () => {
	return () => {
		// Get user from context
		const { user, body } = coreApp.contextFns
			.getContextModel() as MyContext;

		const details = body?.details!;

		// Ensure only managers and above can access this endpoint
		if (!["Manager", "Enterprise", "Ghost"].includes(user.level!)) {
			throwError(
				"Access denied: Insufficient privileges to access this endpoint",
			);
		}

		// Only apply restrictions for Enterprise users
		// Manager and Ghost users have full access
		if (user.level !== "Enterprise") {
			return;
		}

		// Initialize details.set if not present
		if (!details.set) {
			details.set = {};
		}

		// Check if user has provinces-based access
		const hasProvinceAccess = user.settings?.provinces &&
			user.settings.provinces.length > 0;

		// Check if user has city-based access
		const hasCityAccess = user.settings?.cities &&
			user.settings.cities.length > 0;

		// Enterprise user must have either provinces or cities configured
		if (!hasProvinceAccess && !hasCityAccess) {
			throwError(
				"Access denied: You don't have permission to access any cities",
			);
		}

		// Handle province-based access
		if (hasProvinceAccess) {
			const allowedProvinceIds: ObjectId[] = user.settings!.provinces!
				.map(
					(province) => new ObjectId(province._id),
				);

			// If user provided provinceIds filter, validate it
			if (details.set.provinceIds && details.set.provinceIds.length > 0) {
				const requestedProvinceIds = details.set.provinceIds.map(
					(id: string | ObjectId) => new ObjectId(id),
				);
				const allowedProvinceIdsSet = new Set(
					allowedProvinceIds.map((id) => id.toString()),
				);

				// Filter to only include provinces the user has access to
				const filteredProvinceIds = requestedProvinceIds.filter(
					(id: ObjectId) => allowedProvinceIdsSet.has(id.toString()),
				);

				if (filteredProvinceIds.length === 0) {
					throwError(
						"Access denied: You don't have permission to access cities from the requested provinces",
					);
				}

				details.set.provinceIds = filteredProvinceIds;
			} else {
				// No provinceIds provided, set to all allowed provinces
				details.set.provinceIds = allowedProvinceIds;
			}

			// Remove _ids filter if present (province-based access doesn't use city _ids)
			delete details.set._ids;

			console.log("Enterprise province-based city access applied:", {
				userId: user._id,
				level: user.level,
				allowedProvinces: allowedProvinceIds.length,
				appliedProvinceIds: details.set.provinceIds.length,
			});

			return;
		}

		// Handle city-based access
		if (hasCityAccess) {
			const allowedCityIds: ObjectId[] = user.settings!.cities!.map(
				(city) => new ObjectId(city._id),
			);

			// If user provided _ids filter, validate it
			if (details.set._ids && details.set._ids.length > 0) {
				const requestedIds = details.set._ids.map(
					(id: string | ObjectId) => new ObjectId(id),
				);
				const allowedIdsSet = new Set(
					allowedCityIds.map((id) => id.toString()),
				);

				// Filter to only include cities the user has access to
				const filteredIds = requestedIds.filter((id: ObjectId) =>
					allowedIdsSet.has(id.toString())
				);

				if (filteredIds.length === 0) {
					throwError(
						"Access denied: You don't have permission to access the requested cities",
					);
				}

				details.set._ids = filteredIds;
			} else {
				// No _ids provided, set to all allowed cities
				details.set._ids = allowedCityIds;
			}

			// Remove provinceIds filter if present (city-based access doesn't use provinceIds)
			delete details.set.provinceIds;

			console.log("Enterprise city-based access applied:", {
				userId: user._id,
				level: user.level,
				allowedCities: allowedCityIds.length,
				appliedCityIds: details.set._ids.length,
			});
		}
	};
};
