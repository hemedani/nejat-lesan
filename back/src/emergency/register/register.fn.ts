import { type ActFn, ObjectId } from "@deps";
import { coreApp, emergency, shift } from "../../../mod.ts";
import { logOperation, type MyContext, throwError } from "@lib";

/**
 * ثبت درخواست امداد اضطراری (SOS).
 * مأمور فقط محتوای درخواست را می‌فرستد؛ شناسه مأمور از توکن و
 * یگان/خودرو از شیفت فعال او به‌صورت خودکار استخراج و ثبت می‌شود.
 */
export const registerEmergencyFn: ActFn = async (body) => {
	const context: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;
	const actor = context.user;

	if (actor.level !== "Patrol") {
		return throwError("فقط مأمور گشت می‌تواند درخواست امداد ثبت کند");
	}

	const { set, get } = body.details;

	const now = new Date();

	// Resolve the officer's active shift to embed unit + vehicle on the record
	const activeShift = await shift.findOne({
		filters: {
			"officer._id": new ObjectId(actor._id),
			status: "active",
		},
		projection: { patrol_unit: 1, vehicle: 1 },
	});

	const relations: Record<string, any> = {
		officer: { _ids: new ObjectId(actor._id) },
	};

	if (activeShift?.patrol_unit?._id) {
		relations.patrol_unit = { _ids: activeShift.patrol_unit._id };
	}
	if (activeShift?.vehicle?._id) {
		relations.vehicle = { _ids: activeShift.vehicle._id };
	}

	const result = await emergency.insertOne({
		doc: {
			status: "active",
			connection_status: set.connection_status || "online",
			note: set.note,
			location: set.location,
			gps_accuracy: set.gps_accuracy,
			recorded_at: now,
			createdAt: now,
			updatedAt: now,
		},
		relations,
		projection: get,
	});

	// Officer-auditable trail; logging failures never break the main flow
	await logOperation({
		actorId: new ObjectId(actor._id),
		action: "emergency.register",
		entityType: "emergency",
		entityId: result?._id ?? "",
		summary: `ثبت درخواست امداد توسط ${actor.first_name ?? ""} ${
			actor.last_name ?? ""
		}`.trim(),
		changes: {
			connection_status: set.connection_status || "online",
			has_location: Boolean(set.location),
			patrol_unit: activeShift?.patrol_unit?._id?.toString(),
			vehicle: activeShift?.vehicle?._id?.toString(),
		},
	});

	return result;
};
