import { type Document, ObjectId } from "@deps";
import moment from "npm:jalali-moment";

/**
 * The filters that decide *which* rows, as opposed to how many of them come
 * back. Paging is the one thing that is not part of this: `getOversightList`
 * adds it, the statistics acts do not — a count has no page.
 */
export type OversightRowFilters = {
	dateFrom?: string;
	dateTo?: string;
	/** `accident`, or one or more `form_definition_id` values. */
	groupKeys?: string[];
	syncStatus?: string[];
	reviewStatus?: string[];
	officerIds?: string[];
	appVersions?: string[];
	unlinkedOnly?: boolean;
	search?: string;
};

/** The filters the oversight console can combine. */
export type OversightFilters = OversightRowFilters & {
	page: number;
	limit: number;
};

/** The synthetic key the accident branch carries, matching the console's grouping. */
export const ACCIDENT_GROUP_KEY = "accident";

/**
 * Only what the console renders. Without this the embedded `officer` and `road`
 * relations would come back whole — each officer's full user document per row.
 */
export const ROW_PROJECTION: Document = {
	_id: 1,
	report_id: 1,
	source: 1,
	sort_at: 1,
	group_key: 1,
	group_title: 1,
	group_icon: 1,
	sync_status: 1,
	rejection_reason: 1,
	review_status: 1,
	review_reason: 1,
	reviewed_at: 1,
	completed_at: 1,
	location: 1,
	kilometer: 1,
	meter: 1,
	description: 1,
	submitted_from: 1,
	serial: 1,
	"organization._id": 1,
	"officer._id": 1,
	"officer.first_name": 1,
	"officer.last_name": 1,
	"officer.personnel_code": 1,
	"patrol_unit._id": 1,
	"patrol_unit.name": 1,
	"road._id": 1,
	"road.name": 1,
	"form_definition_id": 1,
	"type._id": 1,
	"type.name": 1,
	"incident_severity._id": 1,
	"incident_severity.name": 1,
};

const ids = (values: string[]): ObjectId[] =>
	values.filter((value) => ObjectId.isValid(value)).map((value) =>
		new ObjectId(value)
	);

/** `{ $in: [] }` matches nothing — the sentinel that disables one branch. */
const matchNothing = { _id: { $in: [] as ObjectId[] } };

/**
 * Treat a search term as literal text, never as a pattern.
 *
 * The term arrives straight from a console search box, so a raw `$regex` would let
 * one caller inject quantifiers — `(a+)+` is exponential, and a stalled regex holds
 * a collection cursor for everybody else querying it — or probe the filter's own
 * behaviour with anchors and alternations. A literal match is what the user meant
 * by typing the text anyway.
 *
 * The class is the full PCRE metacharacter set MongoDB compiles: `.` `\` `+` `*`
 * `?` `(` `)` `[` `]` `{` `}` `|` `^` `$`. This is the same idiom already used by
 * `user.getUsers`, `user.countUsers` and `seedShared`.
 *
 * `-` is deliberately left alone. It is only special *inside* a character class,
 * and no character class can survive this function because `[` and `]` are escaped
 * first — so a personnel code like `123-456` stays `123-456` and still matches
 * literally. Persian letters and Persian/ASCII digits are not metacharacters and
 * pass through untouched.
 */
const escapeRegex = (term: string): string =>
	term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const REPORT_SHAPE: Document = {
	// Occurrence first, exactly as the accident branch keys off
	// `date_of_accident`. One date filter over a merged list has to mean one thing:
	// if this were `reported_at` a supervisor reading "3 October" would get
	// *when it happened* for accidents and *when it was filed* for reports, and
	// compare the two halves of one column. `occurred_at` is the date the form's
	// own question produced; `reported_at` is when it reached us, and `createdAt`
	// is the last resort for rows that have neither.
	//
	// Nothing populates `occurred_at` yet, so this changes nothing today and every
	// row still lands on `reported_at` — but it makes the filter mean one thing the
	// day forms start asking for it.
	sort_at: {
		$ifNull: ["$occurred_at", { $ifNull: ["$reported_at", "$createdAt"] }],
	},
	source: "incident_report",
	// A report always has a form, but `$toString` on a missing value errors, so the
	// conditional keeps a hand-inserted legacy row from failing the whole pipeline.
	group_key: {
		$cond: [
			{ $ifNull: ["$form_definition_id", false] },
			{ $toString: "$form_definition_id" },
			null,
		],
	},
	group_title: { $ifNull: ["$form_title", null] },
	group_icon: { $ifNull: ["$form_icon", null] },
};

const ACCIDENT_SHAPE: Document = {
	sort_at: { $ifNull: ["$date_of_accident", "$createdAt"] },
	source: "accident",
	group_key: ACCIDENT_GROUP_KEY,
	group_title: "تصادف",
	group_icon: null,
};

/** Filters that differ per collection, because the fields differ. */
const branchMatches = (filters: OversightRowFilters) => {
	const { groupKeys } = filters;
	const reportMatch: Document = {};
	const accidentMatch: Document = {};

	if (groupKeys?.length) {
		const formIds = groupKeys.filter((key) => key !== ACCIDENT_GROUP_KEY);
		const wantsAccidents = groupKeys.includes(ACCIDENT_GROUP_KEY);

		if (formIds.length) {
			reportMatch["form_definition_id"] = { $in: ids(formIds) };
		} else {
			// No form was selected, only accidents — so the report side has to be
			// closed off. Said on `form_definition_id` rather than `_id` so the
			// branch says *why* it is empty.
			reportMatch["form_definition_id"] = { $in: [] as ObjectId[] };
		}

		if (wantsAccidents) {
			Object.assign(accidentMatch, {});
		} else {
			Object.assign(accidentMatch, matchNothing);
		}
	}

	return { reportMatch, accidentMatch };
};

/**
 * The union stages on their own, so a caller can put something between the union
 * and the match. The two matches exist because each branch is narrowed
 * separately — `groupKeys` can mean "only accidents" or "only this form", and one
 * of the two sides has to be closed off.
 */
const unionPrelude = (
	reportMatch: Document = {},
	accidentMatch: Document = {},
): Document[] => [
	{ $match: reportMatch },
	{ $addFields: REPORT_SHAPE },
	{
		$unionWith: {
			coll: "accident",
			pipeline: [{ $match: accidentMatch }, {
				$addFields: ACCIDENT_SHAPE,
			}],
		},
	},
];

/**
 * The local-day window over `sort_at`, as a whole match clause.
 *
 * Local days, via the same `moment`/`startOf`/`endOf` shape every chart analytics
 * act uses. A UTC day would answer a different question than the officer asked:
 * in Tehran (UTC+3:30) a `2026-10-03` filter built in UTC drops every report
 * filed before 03:30 that morning and quietly keeps the next morning's.
 *
 * `{}` when neither bound is given, so a caller can test for emptiness instead
 * of merging an empty object into its query.
 */
const sortAtRange = (dateFrom?: string, dateTo?: string): Document => {
	const range: Document = {};
	if (dateFrom) range.$gte = moment(dateFrom).startOf("day").toDate();
	// A bare `new Date(dateTo)` is midnight, which would silently exclude every
	// report later that same day.
	if (dateTo) range.$lte = moment(dateTo).endOf("day").toDate();
	return Object.keys(range).length ? { sort_at: range } : {};
};

/** Filters both collections share, applied once after the union. */
const sharedMatch = (filters: OversightRowFilters): Document => {
	const match: Document = {};

	if (filters.syncStatus?.length) {
		match["sync_status"] = { $in: filters.syncStatus };
	}
	if (filters.reviewStatus?.length) {
		match["review_status"] = { $in: filters.reviewStatus };
	}
	if (filters.officerIds?.length) {
		match["officer._id"] = { $in: ids(filters.officerIds) };
	}
	if (filters.appVersions?.length) {
		match["submitted_from.app_version"] = { $in: filters.appVersions };
	}

	if (filters.dateFrom || filters.dateTo) {
		Object.assign(match, sortAtRange(filters.dateFrom, filters.dateTo));
	}

	// Both of these want a `$or`, and one object cannot hold two keys of the same
	// name — so they are collected first and combined under a single `$and` when
	// both are present, rather than one silently overwriting the other.
	const orGroups: Document[][] = [];

	if (filters.unlinkedOnly) {
		orGroups.push([
			{ organization: { $exists: false } },
			{ organization: null },
			{ "organization._id": { $exists: false } },
			{ "organization._id": null },
		]);
	}

	if (filters.search?.trim()) {
		const pattern = {
			$regex: escapeRegex(filters.search.trim()),
			$options: "i",
		};
		orGroups.push([
			{ report_id: pattern },
			{ description: pattern },
			{ group_title: pattern },
		]);
	}

	if (orGroups.length === 1) match.$or = orGroups[0];
	else if (orGroups.length > 1) {
		match.$and = orGroups.map((group) => ({ $or: group }));
	}

	return match;
};

/**
 * Every stage that decides *which* documents are in scope: the union, the
 * server-enforced scope, and every filter the console can combine.
 *
 * The list and the statistics share this builder rather than each assembling its
 * own, because the reconciliation property — the officer table adding up to the
 * list above it — holds only while both sides admit exactly the same rows. A
 * second implementation of the filter would drift, and a reviewer filtering by
 * `returned` would see counts for a population they cannot see.
 */
export const oversightMatchStages = (
	scope: Document,
	filters: OversightRowFilters,
): Document[] => {
	const { reportMatch, accidentMatch } = branchMatches(filters);

	return [
		...unionPrelude(reportMatch, accidentMatch),
		// `$and`, never a merge: both the scope and `sharedMatch` may carry their
		// own `$or`, and one object cannot hold two keys of the same name.
		{ $match: { $and: [scope, sharedMatch(filters)] } },
	];
};

/**
 * Build the merged query.
 *
 * `$unionWith` rather than two `gets` acts because pagination of a union cannot be
 * assembled from two independent `page`/`limit` queries — `total` would be wrong
 * and pages would overlap.
 */
export const buildOversightPipeline = ({
	scope,
	filters,
}: {
	scope: Document;
	filters: OversightFilters;
}): Document[] => {
	// Floored here as well as in the act: `$skip` takes an integer, and a
	// fractional one is a server error rather than a page.
	const skip = Math.max(0, Math.floor((filters.page - 1) * filters.limit));

	return [
		...oversightMatchStages(scope, filters),
		{
			$facet: {
				rows: [
					{ $sort: { sort_at: -1, _id: -1 } },
					{ $skip: skip },
					{ $limit: filters.limit },
					{ $project: ROW_PROJECTION },
				],
				total: [{ $count: "n" }],
			},
		},
	];
};
