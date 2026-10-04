import { type Document } from "@deps";

import { oversightMatchStages, type OversightRowFilters } from "./pipeline.ts";

/** Groups reports that were never filed from the app. */
export const NO_VERSION = "—";

/**
 * What a report with no officer relation is filed under in the officer table.
 *
 * A sentinel rather than `""`, which is what the group key actually is: an empty
 * string in an id column is indistinguishable from a real id at a glance, and a
 * client that links a row to a profile would build `/users/`. `unattributed` is
 * not a valid `ObjectId`, so it cannot collide with one either.
 *
 * These reports are **labelled, not dropped**. The invariant the console rests on
 * is that the officer table adds up to the list above it; silently removing the
 * unattributable volume would keep the arithmetic honest while telling a
 * supervisor their officers filed less than they did.
 */
export const UNATTRIBUTED_OFFICER_ID = "unattributed";

/**
 * "This field is actually there", as an aggregation expression.
 *
 * `{ $ne: ["$synced_at", null] }` reads like that test and is not one: inside an
 * aggregation `$ne` against `null` is **true even when the field is missing**, so
 * such a guard never rejects anything, and `$subtract` over two missing fields
 * yields `null` rather than an error. The result is a `null` pushed into the
 * durations array, which sorts as 0 and reads as an instantaneous sync.
 *
 * `$ifNull` resolves the missing case explicitly, after which the comparison does
 * what it looks like. (`{ $eq: [{ $type: "$field" }, "date"] }` is the other
 * spelling; it would also reject a legacy string date, which `$ifNull` keeps.)
 */
const hasField = (field: string): Document => ({
	$ne: [{ $ifNull: [`$${field}`, null] }, null],
});

/**
 * When the report reached the control centre: `reported_at`, or the merged
 * `sort_at` for a record with no filing instant at all. `null` when neither
 * exists, so the caller can tell "never filed" from "filed at the epoch".
 *
 * `sort_at` is *not* the filed-at answer on its own — on the accident branch it
 * is `date_of_accident`, i.e. when the crash happened — which is why
 * `reported_at` is tried first. The fallback only applies to a record that
 * carries no filing instant at all, where showing the best available instant beats
 * showing nothing.
 *
 * The one definition of "filed" for the whole act: the officer table's first/last
 * bounds and the aging clock both read this field, so a supervisor comparing "last
 * filed" against "stuck for N hours" is not comparing two answers to the same
 * question.
 */
const FILED_AT: Document = {
	$ifNull: [{ $ifNull: ["$reported_at", "$sort_at"] }, null],
};

const median = (values: number[]): number | null => {
	// Filtered rather than trusted: a single null or NaN in the array would sort as
	// 0 and turn an unknown duration into the most flattering one there is.
	const sorted = values.filter((value) => Number.isFinite(value)).sort((
		a,
		b,
	) => a - b);
	if (sorted.length === 0) return null;
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0
		? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
		: sorted[middle];
};

export type OfficerStat = {
	officer_id: string;
	/**
	 * True when this row is the `UNATTRIBUTED_OFFICER_ID` bucket rather than a
	 * person. Present on every row so a client never has to infer it from the id.
	 */
	unattributed: boolean;
	first_name?: string;
	last_name?: string;
	personnel_code?: string;
	total: number;
	queued: number;
	rejected: number;
	returned: number;
	approved: number;
	completed: number;
	/** When this officer first filed a report. See `FILED_AT`. */
	first_reported_at?: Date | null;
	/** When this officer last filed a report. See `FILED_AT`. */
	last_reported_at?: Date | null;
	/** Null when no row carried `synced_at` — never 0. */
	median_sync_ms: number | null;
};

export type AppVersionStat = {
	app_version: string;
	total: number;
	rejected: number;
	distinct_officers: number;
};

export type AgingStat = {
	queued: number;
	under_review: number;
	thresholdHours: number;
};

/**
 * Per-officer rows.
 *
 * `filters` is the console's own filter set, run through the same
 * `oversightMatchStages` builder as `getOversightList` — so the totals here
 * describe the rows the reviewer is looking at, not every row the organization
 * ever filed. A statistics act that ignored `syncStatus` would be the one place
 * where the count above the table disagrees with the table under it.
 *
 * The median is computed here rather than in the pipeline: an exact median is
 * awkward to express in an aggregation portably, and the population is bounded by
 * the caller's organization and date range. Durations are pushed as an array and
 * reduced in JS; revisit with `$percentile` if a single officer's volume ever
 * makes that array large.
 *
 * `durations` pushes with `$$REMOVE` rather than a null placeholder, so a record
 * that never recorded a sync instant contributes no element at all. That is what
 * makes an empty array mean "unknown" and reach `median([])` → `null`: a record
 * the server could not date (a back-office report already synced when it was
 * filed) has no duration to average, and a zero would read as instantaneous.
 */
export const officerStatsPipeline = (
	scope: Document,
	filters: OversightRowFilters,
): Document[] => [
	...oversightMatchStages(scope, filters),
	{ $addFields: { filed_at: FILED_AT } },
	{
		$group: {
			_id: "$officer._id",
			first_name: { $first: "$officer.first_name" },
			last_name: { $first: "$officer.last_name" },
			personnel_code: { $first: "$officer.personnel_code" },
			total: { $sum: 1 },
			queued: {
				$sum: { $cond: [{ $eq: ["$sync_status", "queued"] }, 1, 0] },
			},
			rejected: {
				$sum: { $cond: [{ $eq: ["$sync_status", "rejected"] }, 1, 0] },
			},
			returned: {
				$sum: {
					$cond: [{ $eq: ["$review_status", "returned"] }, 1, 0],
				},
			},
			approved: {
				$sum: {
					$cond: [{ $eq: ["$review_status", "approved"] }, 1, 0],
				},
			},
			completed: {
				$sum: {
					$cond: [{ $eq: ["$review_status", "completed"] }, 1, 0],
				},
			},
			// `filed_at`, never `sort_at`: these two names promise the moment the
			// report was filed, `sort_at` prefers when it *happened*, and `aging`
			// already ages from filed-at — one clock for the whole act, so a
			// supervisor reading "first filed" against "stuck for 3 days" is
			// comparing two answers to the same question.
			first_reported_at: { $min: "$filed_at" },
			last_reported_at: { $max: "$filed_at" },
			durations: {
				$push: {
					$cond: [
						{
							$and: [
								hasField("synced_at"),
								hasField("reported_at"),
							],
						},
						{ $subtract: ["$synced_at", "$reported_at"] },
						"$$REMOVE",
					],
				},
			},
		},
	},
	{ $sort: { last_reported_at: -1 } },
];

/**
 * Per-app-version rows.
 *
 * `NO_VERSION` is `$ifNull` rather than a filter, so records the app never filed
 * stay in the totals instead of quietly reducing them — which is what makes the
 * version totals add up to the list's `total` for the same filter.
 */
export const appVersionStatsPipeline = (
	scope: Document,
	filters: OversightRowFilters,
): Document[] => [
	...oversightMatchStages(scope, filters),
	{
		$group: {
			_id: { $ifNull: ["$submitted_from.app_version", NO_VERSION] },
			total: { $sum: 1 },
			rejected: {
				$sum: { $cond: [{ $eq: ["$sync_status", "rejected"] }, 1, 0] },
			},
			officers: { $addToSet: "$officer._id" },
		},
	},
	{ $sort: { total: -1 } },
];

/**
 * How long reports have been sitting in a state that can stall.
 *
 * `queued` ages from when the report was filed (`filed_at`), **not** from
 * `sort_at`: on the accident branch `sort_at` is `date_of_accident`, so a crash
 * filed with the control centre this morning would be reported as having been
 * stuck since it happened — which can be weeks. `sort_at` is the fallback for a
 * record that carries no filing instant at all.
 *
 * `under_review` ages from `reviewed_at`, since that is when the clock on a
 * reviewer begins. A record in that state with no `reviewed_at` is *not* counted:
 * without the start instant its age is unknown, and MongoDB compares a missing
 * field as null, which sorts before every date — so an unguarded `$lt` would
 * report every such record as permanently stuck.
 */
export const agingPipeline = (
	scope: Document,
	filters: OversightRowFilters,
	thresholdHours: number,
	now: Date,
): Document[] => {
	const cutoff = new Date(now.getTime() - thresholdHours * 60 * 60 * 1000);
	return [
		...oversightMatchStages(scope, filters),
		{ $addFields: { filed_at: FILED_AT } },
		{
			$group: {
				_id: null,
				queued: {
					$sum: {
						$cond: [
							{
								$and: [
									{ $eq: ["$sync_status", "queued"] },
									// No instant at all means no age to compare; see `hasField`.
									{ $ne: ["$filed_at", null] },
									{ $lt: ["$filed_at", cutoff] },
								],
							},
							1,
							0,
						],
					},
				},
				under_review: {
					$sum: {
						$cond: [
							{
								$and: [
									{ $eq: ["$review_status", "under_review"] },
									hasField("reviewed_at"),
									{ $lt: ["$reviewed_at", cutoff] },
								],
							},
							1,
							0,
						],
					},
				},
			},
		},
	];
};

export const reduceOfficerStats = (
	rows: Array<Record<string, unknown>>,
): OfficerStat[] =>
	rows.map((row) => {
		const id = row["_id"];
		return {
			// A group with no officer has a null key; labelled, never blank.
			officer_id: id == null ? UNATTRIBUTED_OFFICER_ID : String(id),
			unattributed: id == null,
			first_name: row["first_name"] as string | undefined,
			last_name: row["last_name"] as string | undefined,
			personnel_code: row["personnel_code"] as string | undefined,
			total: Number(row["total"] ?? 0),
			queued: Number(row["queued"] ?? 0),
			rejected: Number(row["rejected"] ?? 0),
			returned: Number(row["returned"] ?? 0),
			approved: Number(row["approved"] ?? 0),
			completed: Number(row["completed"] ?? 0),
			first_reported_at: row["first_reported_at"] as
				| Date
				| null
				| undefined,
			last_reported_at: row["last_reported_at"] as
				| Date
				| null
				| undefined,
			median_sync_ms: median(
				(row["durations"] as number[] | undefined) ?? [],
			),
		};
	});

export const reduceAppVersionStats = (
	rows: Array<Record<string, unknown>>,
): AppVersionStat[] =>
	rows.map((row) => ({
		app_version: String(row["_id"] ?? NO_VERSION),
		total: Number(row["total"] ?? 0),
		rejected: Number(row["rejected"] ?? 0),
		// `$addToSet` collects the null of an officerless report as one member;
		// counting it would credit a build with an officer who never filed from it.
		distinct_officers: Array.isArray(row["officers"])
			? row["officers"].filter((id) => id != null).length
			: 0,
	}));

export const reduceAging = (
	rows: Array<Record<string, unknown>>,
	thresholdHours: number,
): AgingStat => {
	const row = (rows[0] ?? {}) as Record<string, unknown>;
	return {
		queued: Number(row["queued"] ?? 0),
		under_review: Number(row["under_review"] ?? 0),
		thresholdHours,
	};
};
