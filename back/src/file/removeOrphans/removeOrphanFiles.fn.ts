import { type ActFn, ObjectId } from "@deps";
import { file } from "../../../mod.ts";

const DEFAULT_OLDER_THAN_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Relations that can claim a file, so "orphan" means "claimed by neither".
 *
 * A file is not made reachable by the write that uploads it — `file.uploadFile`
 * only records an uploader — it is made reachable by whichever act later links it
 * into a report. Both kinds of report have to be consulted, or this sweep becomes
 * the thing that deletes filed evidence: it would reap a non-accident attachment
 * the same week it was uploaded, because no `accident.attachments` row mentions it.
 */
const CLAIMING_RELATIONS = [
	{ from: "accident", relation: "attachments" },
	{ from: "incident_report", relation: "attachments" },
] as const;

const refField = (index: number) => `refs_${index}`;

/**
 * Does any report in `collection` embed this file under `relation`?
 *
 * `$size` over a `$filter` rather than a plain `$eq` on `_id`, because the relation
 * is an embedded array: matching has to look inside the snapshots. `as` is passed in
 * because two `$lookup` stages writing the same field means the second silently
 * overwrites the first.
 */
const referencedBy = (
	collection: string,
	relation: string,
	as: string,
) => ({
	$lookup: {
		from: collection,
		let: { fid: "$_id" },
		pipeline: [
			{
				$match: {
					$expr: {
						$gt: [
							{
								$size: {
									$ifNull: [
										{
											$filter: {
												input: {
													$ifNull: [
														`$${relation}`,
														[],
													],
												},
												cond: {
													$eq: [
														"$$this._id",
														"$$fid",
													],
												},
											},
										},
										[],
									],
								},
							},
							0,
						],
					},
				},
			},
			{ $project: { _id: 1 } },
		],
		as,
	},
});

/**
 * حذف فایل‌های بی‌صاحب:
 * فایل‌های آپلودشده‌ای که هیچ گزارشی — نه accident و نه incident_report — آن‌ها را در
 * رابطه attachments ارجاع نکرده، از تاریخ قطع (پیش‌فرض ۷ روز) قدیمی‌ترند.
 * سندهای فایل و بایت‌های روی دیسک هر دو حذف می‌شوند (حذف دیسک best-effort).
 */
export const removeOrphanFilesFn: ActFn = async (body) => {
	const {
		set: { olderThanDays },
	} = body.details;

	const days = typeof olderThanDays === "number" && olderThanDays > 0
		? olderThanDays
		: DEFAULT_OLDER_THAN_DAYS;

	const cutoff = new Date(Date.now() - days * MS_PER_DAY);

	const orphanDocs = await file
		.aggregation({
			pipeline: [
				{
					$match: {
						// A file a writing act already bound to a report is never an
						// orphan, whatever the lookups below say.
						accident: { $exists: false },
						incident_report: { $exists: false },
						createdAt: { $lt: cutoff },
					},
				},
				...CLAIMING_RELATIONS.map(({ from, relation }, index) =>
					referencedBy(from, relation, refField(index))
				),
				{
					// Derived from the same table, so adding a claiming relation cannot
					// leave a stage behind that forgets to require it to come back empty.
					$match: Object.fromEntries(
						CLAIMING_RELATIONS.map((_, index) => [
							refField(index),
							{ $size: 0 },
						]),
					),
				},
				{ $project: { name: 1, path: 1 } },
			],
			projection: { _id: 1, name: 1, path: 1 },
		})
		.toArray();

	let removed = 0;
	for (const doc of orphanDocs) {
		// Where the bytes went is recorded per document, not assumed: `file.uploadFile`
		// writes to one of six trees and `file.uploadAccidentImages` always writes
		// `accidents/`. Hardcoding that directory deleted nothing for the other five
		// and leaked their bytes. Documents predating the `path` field are all
		// accident uploads, hence the fallback.
		const path = (doc.path as string | undefined) ??
			`accidents/${doc.name as string}`;
		try {
			await Deno.remove(`./uploads/${path}`);
		} catch (_error) {
			// disk cleanup is best-effort; the doc removal below is authoritative
		}
		await file.deleteOne({ filter: { _id: new ObjectId(doc._id) } });
		removed++;
	}

	return { removed };
};
