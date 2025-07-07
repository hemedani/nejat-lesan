/**
 * -----------------------------------------------------------------------------
 * FILE: eventCollisionAnalytics.fn.ts (Full Filters & Advanced Aggregation)
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function uses a single, efficient MongoDB Aggregation Pipeline with the
 * `$facet` operator to generate two separate datasets: one for accidents
 * *during* the specified event period, and one for accidents *outside* of it,
 * calculating the share of selected collision types for each.
 */
import type { ActFn, Document } from "@deps";
import { accident, collision_type } from "../../../../mod.ts";
import moment from "npm:jalali-moment";

export const eventCollisionAnalyticsFn: ActFn = async (body) => {
	const { set: filters } = body.details;

	// --- 1. Define Date Ranges ---
	const overallStartDate = filters.dateOfAccidentFrom
		? moment(filters.dateOfAccidentFrom).startOf("day").toDate()
		: moment().subtract(1, "year").startOf("day").toDate();
	const overallEndDate = filters.dateOfAccidentTo
		? moment(filters.dateOfAccidentTo).endOf("day").toDate()
		: moment().endOf("day").toDate();

	const eventStartDate = moment(filters.eventDateFrom).startOf("day")
		.toDate();
	const eventEndDate = moment(filters.eventDateTo).endOf("day").toDate();

	// --- 2. Build Comprehensive Base Filter ---
	const matchFilter: Document = {
		date_of_accident: { $gte: overallStartDate, $lte: overallEndDate },
	};

	// --- Add all other user-selected filters ---
	const arrayFilters: { [key: string]: string } = {
		province: "province.name",
		city: "city.name",
		road: "road.name",
		accidentType: "type.name",
		position: "position.name",
		lightStatus: "light_status.name",
		roadSituation: "road_situation.name",
		humanReasons: "human_reasons.name",
		roadDefects: "road_defects.name",
	};

	for (const key in arrayFilters) {
		if (filters[key] && filters[key]?.length > 0) {
			matchFilter[arrayFilters[key]] = { $in: filters[key] };
		}
	}
	// ... add more filter logic here ...

	// --- 3. Define Default Collision Types & Execute Aggregation ---
	const defaultCollisionTypes = [
		"برخورد وسیله نقلیه با شیء ثابت",
		"واژگونی و سقوط",
		"خروج از جاده",
		"برخورد وسیله نقلیه با یک وسیله نقلیه",
	];

	const collisionTypesToAnalyze =
		(filters.collisionType && filters.collisionType.length > 0)
			? filters.collisionType
			: defaultCollisionTypes;

	const pipeline: Document[] = [
		{ $match: matchFilter },
		{
			$facet: {
				// --- Part 1: Data for accidents WITHIN the event period ---
				eventData: [
					{
						$match: {
							date_of_accident: {
								$gte: eventStartDate,
								$lte: eventEndDate,
							},
						},
					},
					{
						$group: {
							_id: "$collision_type.name",
							count: { $sum: 1 },
						},
					},
					{ $project: { _id: 0, name: "$_id", count: "$count" } },
				],
				// --- Part 2: Data for accidents OUTSIDE the event period ---
				nonEventData: [
					{
						$match: {
							date_of_accident: {
								$not: {
									$gte: eventStartDate,
									$lte: eventEndDate,
								},
							},
						},
					},
					{
						$group: {
							_id: "$collision_type.name",
							count: { $sum: 1 },
						},
					},
					{ $project: { _id: 0, name: "$_id", count: "$count" } },
				],
			},
		},
	];

	const results = await accident.aggregation({ pipeline }).toArray();
	const analyticsData = results[0] || { eventData: [], nonEventData: [] };

	// --- 4. Helper function to calculate percentage share ---
	const calculateShare = (data: { name: string; count: number }[]) => {
		const total = data.reduce((sum, item) => sum + item.count, 0);
		if (total === 0) return [];

		return data.map((item) => ({
			name: item.name,
			share: (item.count / total) * 100,
		})).filter((item) => collisionTypesToAnalyze.includes(item.name));
	};

	// --- 5. Format and Return the Final Payload ---
	return {
		analytics: {
			eventData: calculateShare(analyticsData.eventData),
			nonEventData: calculateShare(analyticsData.nonEventData),
		},
	};
};
