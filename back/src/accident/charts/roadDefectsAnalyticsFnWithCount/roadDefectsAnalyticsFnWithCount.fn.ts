/**
 * -----------------------------------------------------------------------------
 * FILE: roadDefectsAnalytics.fn.ts (LOOPING COUNT VERSION)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function provides an alternative to aggregation for performance testing.
 * It is designed for scenarios where the set of categories (RoadDefects) is very
 * small.
 *
 * It works by:
 * 1.  Fetching all possible road defect types (a small query).
 * 2.  Creating a `countDocuments` query for each defect type.
 * 3.  Running all count queries in parallel using `Promise.all`.
 * 4.  Calculating the final totals in the application code.
 *
 * This avoids a single, potentially slow aggregation at the cost of making
 * multiple, smaller database requests.
 */
import type { ActFn, Document } from "@deps";
// Assuming 'roadDefect' model is exported similarly to 'accident'
import { accident, road_defect } from "../../../../mod.ts";

export const roadDefectsAnalyticsFnWithCount: ActFn = async (body) => {
	const { set: filters } = body.details;

	// Build the dynamic filter query object, same as before.
	const matchFilter: Document = {};
	if (filters.province) matchFilter["province.name"] = filters.province;
	if (filters.dateOfAccidentFrom || filters.dateOfAccidentTo) {
		matchFilter.date_of_accident = {};
		if (filters.dateOfAccidentFrom) {
			matchFilter.date_of_accident.$gte = new Date(
				filters.dateOfAccidentFrom,
			);
		}
		if (filters.dateOfAccidentTo) {
			matchFilter.date_of_accident.$lte = new Date(
				filters.dateOfAccidentTo,
			);
		}
	}
	// ... build the rest of the matchFilter object from all incoming filters ...

	// --- 1. Fetch all possible defect types (a small, fast query) ---
	const allDefectTypes = await road_defect.find({
		filters: { name: { $ne: "ندارد" } },
		projection: { name: 1 },
	}).toArray();

	// --- 2. Create an array of promises for counting each defect ---
	const barChartPromises = allDefectTypes.map((defectType) =>
		accident.countDocument({
			filter: {
				...matchFilter,
				"road_defects.name": defectType.name,
			},
		}).then((count) => ({ name: defectType.name, count })) // Return object with name and count
	);

	// --- 3. Create a separate promise for counting accidents WITHOUT defects ---
	const withoutDefectQuery = {
		...matchFilter,
		"$or": [
			{ "road_defects": { "$exists": false } },
			{ "road_defects": [] },
			{ "road_defects": { "$elemMatch": { "name": "ندارد" } } },
		],
	};
	const withoutDefectPromise = accident.countDocument({
		filter: withoutDefectQuery,
	});

	// --- 4. Run all count operations in parallel ---
	const [barChartData, withoutDefectCount] = await Promise.all([
		Promise.all(barChartPromises),
		withoutDefectPromise,
	]);

	// --- 5. Format and Return the Final Payload ---
	// Filter out defects with zero count and sort
	const finalBarChartData = barChartData
		.filter((item) => item.count > 0)
		.sort((a, b) => b.count - a.count);

	// Calculate the total 'withDefect' count from the bar chart data
	const withDefectCount = finalBarChartData.reduce(
		(sum, item) => sum + item.count,
		0,
	);

	const distribution = {
		withDefect: withDefectCount,
		withoutDefect: withoutDefectCount,
	};

	return {
		defectDistribution: distribution,
		defectCounts: finalBarChartData,
	};
};
