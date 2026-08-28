import { type ActFn, ObjectId } from "@deps";
import { emergency } from "../../../mod.ts";
import { logOperation, type MyContext, throwError } from "@lib";
import { coreApp } from "../../../mod.ts";

const ALLOWED = ["active", "acknowledged", "resolved"] as const;

export const updateEmergencyStatusFn: ActFn = async (body) => {
	const context: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;
	const actor = context.user;

	const {
		set: { _id, status },
		get,
	} = body.details;

	if (!ALLOWED.includes(status as (typeof ALLOWED)[number])) {
		return throwError("وضعیت نامعتبر است");
	}

	const existing = await emergency.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: { _id: 1 },
	});

	if (!existing) return throwError("درخواست امداد یافت نشد");

	const now = new Date();

	const updateObj: Record<string, any> = {
		status,
		updatedAt: now,
	};
	if (status === "resolved") updateObj.resolved_at = now;

	await logOperation({
		actorId: new ObjectId(actor._id),
		action: "emergency.updateStatus",
		entityType: "emergency",
		entityId: _id as string,
		summary: `تغییر وضعیت درخواست امداد به ${status}`,
		changes: { from: "see doc", to: status },
	});

	return await emergency.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: { $set: updateObj },
		projection: get,
	});
};
