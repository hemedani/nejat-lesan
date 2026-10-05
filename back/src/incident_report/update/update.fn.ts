import { type ActFn, ObjectId } from "@deps";
import { coreApp, incident_report } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";
import { splitRelationIds } from "../relations.ts";

const TERMINAL_SYNC = ["synced", "rejected"];

/**
 * Correct a filed report.
 *
 * The officer may only touch a report they own, and only while it has not been
 * acknowledged — same rule as an accident, so the two models behave identically
 * for the person using the app.
 */
export const updateFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const filter: Record<string, unknown> = {};
	if (set._id) filter._id = new ObjectId(set._id as string);
	else if (set.client_report_uuid) {
		filter.client_report_uuid = set.client_report_uuid;
	} else {
		return throwError("شناسه گزارش یا شناسه موقت ارسال نشده است");
	}

	if (user.level === "Patrol") {
		filter["officer._id"] = new ObjectId(user._id);
	}

	const existing = await incident_report.findOne({
		filters: filter,
		projection: { _id: 1, sync_status: 1, review_status: 1, synced_at: 1 },
	});
	if (!existing) {
		return throwError("گزارش یافت نشد یا به آن دسترسی ندارید");
	}

	const current = existing as unknown as {
		_id: ObjectId;
		sync_status?: string;
		review_status?: string;
		synced_at?: Date;
	};

	// A delivered report is frozen for the officer who filed it — with one
	// exception, and it is the exception the correction flow is built on: the
	// control centre has handed the report back, so editing it is the whole point.
	// `resubmitReport` requires a report that is simultaneously `synced` and
	// `returned`, so the edit that precedes a resubmission is precisely the case a
	// blanket terminal guard refuses — which left a returned report unfixable.
	const delivered = TERMINAL_SYNC.includes(current.sync_status ?? "");
	if (
		user.level === "Patrol" &&
		delivered &&
		current.review_status !== "returned"
	) {
		return throwError("این گزارش همگام شده و دیگر قابل ویرایش نیست");
	}

	const { doc: body_, relations } = splitRelationIds(
		set as Record<string, unknown>,
	);
	// Identity, provenance and lifecycle columns are not client-writable.
	for (
		const key of [
			"_id",
			"form_definition_id",
			"serial",
			"report_id",
			"review_status",
			"review_reason",
			"reviewed_at",
			"completed_at",
			"synced_at",
		]
	) {
		delete body_[key];
	}

	const updateObj: Record<string, unknown> = { updatedAt: new Date() };
	for (const [key, value] of Object.entries(body_)) {
		if (value !== undefined) updateObj[key] = value;
	}

	// First transition to `synced` records the instant; later corrections leave it.
	if (body_.sync_status === "synced" && !current.synced_at) {
		updateObj.synced_at = new Date();
	}

	const updated = await incident_report.findOneAndUpdate({
		filter: { _id: current._id },
		update: { $set: updateObj },
		projection: get,
	});

	// Relations are written separately — never through `update`, which is only for
	// document properties.
	for (const [relation, payload] of Object.entries(relations)) {
		await incident_report.addRelation({
			filters: { _id: current._id },
			relations: { [relation]: payload } as never,
			projection: get,
			replace: true,
		});
	}

	return updated;
};
