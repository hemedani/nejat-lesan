import { type ActFn } from "@deps";
import { coreApp } from "../../../../mod.ts";
import { type MyContext } from "@lib";
import { resolveOversightScope } from "../filters.ts";
import { type OversightRowFilters } from "../pipeline.ts";
import {
	agingPipeline,
	appVersionStatsPipeline,
	officerStatsPipeline,
	reduceAging,
	reduceAppVersionStats,
	reduceOfficerStats,
} from "../stats.ts";

const DEFAULT_THRESHOLD_HOURS = 24;

/**
 * The three blocks the oversight console's statistics panels read.
 *
 * Runs through the **raw** collection driver, for the same reason as
 * `getOversightList`: Lesan's `aggregation()` appends `$lookup`/`$unwind`/`$project`
 * stages derived from the client's `get`, which cannot follow a `$unionWith`
 * branch into a second collection.
 */
export const getOversightStatsFn: ActFn = async (body) => {
	const set = (body.details.set ?? {}) as Record<string, unknown>;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const scope = await resolveOversightScope(
		user as never,
		typeof set.organizationId === "string" ? set.organizationId : undefined,
	);

	// The console's filters, handed to the pipeline unchanged. These counts sit
	// directly above the list the reviewer is reading, so a filter applied there
	// and not here is a visible disagreement — and the local-day window the list
	// builds is read from these same fields by `sharedMatch`, not re-derived.
	const filters: OversightRowFilters = {
		dateFrom: typeof set.dateFrom === "string" ? set.dateFrom : undefined,
		dateTo: typeof set.dateTo === "string" ? set.dateTo : undefined,
		groupKeys: set.groupKeys as string[] | undefined,
		syncStatus: set.syncStatus as string[] | undefined,
		reviewStatus: set.reviewStatus as string[] | undefined,
		officerIds: set.officerIds as string[] | undefined,
		appVersions: set.appVersions as string[] | undefined,
		unlinkedOnly: set.unlinkedOnly as boolean | undefined,
		search: set.search as string | undefined,
	};

	// `number()` admits a negative or fractional threshold, and a fractional
	// `thresholdHours` would put the cutoff at a fractional millisecond. Anything
	// that is not a positive number falls back to the default rather than
	// producing a cutoff that counts every row.
	const requested = Number(set.thresholdHours);
	const thresholdHours = Number.isFinite(requested) && requested > 0
		? Math.floor(requested)
		: DEFAULT_THRESHOLD_HOURS;

	const collection = coreApp.odm.getCollection("incident_report");
	const [officerRows, versionRows, agingRows] = await Promise.all([
		collection.aggregate(officerStatsPipeline(scope, filters)).toArray(),
		collection.aggregate(appVersionStatsPipeline(scope, filters)).toArray(),
		collection.aggregate(
			agingPipeline(scope, filters, thresholdHours, new Date()),
		).toArray(),
	]);

	return {
		byOfficer: reduceOfficerStats(
			officerRows as Array<Record<string, unknown>>,
		),
		byAppVersion: reduceAppVersionStats(
			versionRows as Array<Record<string, unknown>>,
		),
		aging: reduceAging(
			agingRows as Array<Record<string, unknown>>,
			thresholdHours,
		),
	};
};
