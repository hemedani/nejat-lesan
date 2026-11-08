import { ObjectId } from "@deps";
import { accident, file, incident_report } from "../../mod.ts";
import { removeStoredBytes, type StoredFileRef } from "@lib";

/**
 * What a report owns besides its own row: its attachments, on both sides of the
 * relation, and the bytes behind them.
 *
 * The two sides are not symmetric, and that asymmetry is why a report delete
 * does not clean up after itself on its own. A `file` document holds an
 * optional `accident`/`incident_report` relation, and that is what Lesan's
 * `hardCascade` follows — but only `file.uploadAccidentImages` writes it.
 * Everything that attaches an already-uploaded file does so from the report
 * side (`accident.add`, `accident.update`, `incident_report.add`/`update` pass
 * `attachments: { _ids }` with no `relatedRelations`, and `accident.add` says so
 * in a comment: "No reverse relation"). Those rows carry no back-reference, so:
 *
 *   - the cascade does not see them and leaves them behind as orphans, and
 *   - nothing points at the bytes, so `file.removeOrphans` is the only thing
 *     that will ever reclaim them — seven days later, and only if someone runs
 *     it.
 *
 * So a report delete reads both sides before it runs, and finishes the job
 * afterwards: unlink the bytes of everything the cascade took, and delete the
 * rows it left behind — but only once nothing else claims them.
 */

/** The two collections a report can live in. */
export type ReportModel = "accident" | "incident_report";

type AttachmentDoc = StoredFileRef & { _id: ObjectId };

/**
 * Resolved per call, never at module scope: acts are registered during
 * `functionsSetup`, which runs while `back/mod.ts` is still instantiating
 * models, so touching one earlier is a temporal-dead-zone crash.
 */
const reportModel = (model: ReportModel) =>
	model === "accident" ? accident : incident_report;

/** What has to be known before the delete, because afterwards it is gone. */
export type AttachmentPlan = {
	/** Files carrying the back-reference. The cascade removes their rows. */
	cascaded: AttachmentDoc[];
	/** Ids the report listed that carry no back-reference. */
	leftoverIds: ObjectId[];
};

/**
 * Read both sides of a report's attachments.
 *
 * Must run before the delete. `findOne` is projected through the same shape the
 * tests use, because the report's own `attachments` array is a denormalised
 * snapshot and the ids are all that is needed from it.
 */
export const planAttachmentCleanup = async (
	model: ReportModel,
	reportId: ObjectId,
): Promise<AttachmentPlan> => {
	const cascaded = await file.find({
		filters: { [`${model}._id`]: reportId },
		projection: { _id: 1, name: 1, path: 1 },
	}).toArray() as AttachmentDoc[];

	const report = await reportModel(model).findOne({
		filters: { _id: reportId },
		projection: { _id: 1, attachments: { _id: 1 } },
	}) as { attachments?: Array<{ _id?: ObjectId }> } | null;

	const cascadedIds = new Set(cascaded.map((doc) => String(doc._id)));
	const leftoverIds = (report?.attachments ?? [])
		.map((attachment) => attachment._id)
		.filter((id): id is ObjectId => Boolean(id))
		.filter((id) => !cascadedIds.has(String(id)));

	return { cascaded, leftoverIds };
};

/**
 * Which of `ids` some *other* report still lists, in one query per collection.
 *
 * The report this cleanup belongs to is already deleted, so anything that comes
 * back here belongs to a report that has to keep the file. One `$in` per
 * collection rather than a count per file: the filter is on an embedded array
 * with no index, so the cost is a scan either way and it may as well be one.
 */
const stillListed = async (ids: ObjectId[]): Promise<Set<string>> => {
	if (ids.length === 0) return new Set();

	const projection = { _id: 1, attachments: { _id: 1 } };
	type Row = { attachments?: Array<{ _id?: ObjectId }> };

	const rows = [
		...(await accident.find({
			filters: { "attachments._id": { $in: ids } },
			projection,
		}).toArray() as Row[]),
		...(await incident_report.find({
			filters: { "attachments._id": { $in: ids } },
			projection,
		}).toArray() as Row[]),
	];

	const listed = new Set<string>();
	for (const row of rows) {
		for (const attachment of row.attachments ?? []) {
			if (attachment._id) listed.add(String(attachment._id));
		}
	}
	return listed;
};

/**
 * Finish a report delete: free the bytes, and the rows the cascade could not
 * reach.
 *
 * Call **after** the report is gone, and only when it is actually gone — a
 * refused delete must not lose evidence.
 */
export const releaseReportAttachments = async (
	plan: AttachmentPlan,
): Promise<void> => {
	// Their rows went with the report; only the bytes are left.
	await removeStoredBytes(plan.cascaded);

	if (plan.leftoverIds.length === 0) return;

	// Re-read rather than trusting the plan: a file may have been claimed by
	// another report between the plan and the delete, and the fields that say so
	// are exactly the back-references.
	const rows = await file.find({
		filters: { _id: { $in: plan.leftoverIds } },
		projection: {
			_id: 1,
			name: 1,
			path: 1,
			accident: { _id: 1 },
			incident_report: { _id: 1 },
		},
	}).toArray() as Array<
		AttachmentDoc & {
			accident?: { _id?: ObjectId };
			incident_report?: { _id?: ObjectId };
		}
	>;

	const orphans = rows.filter((row) =>
		!(row.accident?._id || row.incident_report?._id)
	);

	const listed = await stillListed(orphans.map((row) => row._id));

	for (const row of orphans) {
		// Another report lists it: its row is not this delete's to remove.
		if (listed.has(String(row._id))) continue;
		// Bytes first, then the row — the order `file.removeOrphans` uses. A
		// failed unlink then costs disk, not a row that resolves to nothing.
		await removeStoredBytes([row]);
		await file.deleteOne({ filter: { _id: row._id } });
	}
};
