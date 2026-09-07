import { type ActFn, ObjectId } from "@deps";
import { coreApp, goods_request } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";

/**
 * pending → approved (یا rejected با approve:false).
 * فقط مدیر یا سرپرست با scope مرتبط.
 */
export const approveFn: ActFn = async (body) => {
	const {
		set: { _id, approve },
		get,
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const request = await goods_request.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: { _id: 1, status: 1, "unit._id": 1 },
	});
	if (!request) return throwError("درخواست یافت نشد");
	if ((request as any).status !== "pending") {
		return throwError("فقط درخواست‌های در انتظار تأیید قابل تأیید/رد هستند");
	}

	const shouldApprove = approve !== false;
	const now = new Date();

	await goods_request.findOneAndUpdate({
		filter: { _id: request._id as ObjectId },
		update: shouldApprove
			? {
				$set: {
					status: "approved",
					approved_at: now,
					updatedAt: now,
				},
			}
			: {
				$set: { status: "rejected", updatedAt: now },
			},
		projection: { _id: 1 },
	});

	if (shouldApprove) {
		await goods_request.addRelation({
			filters: { _id: request._id as ObjectId },
			relations: {
				approved_by: {
					_ids: user._id,
				},
			},
			projection: { _id: 1 },
		});
	}

	return await goods_request.findOne({
		filters: { _id: request._id as ObjectId },
		projection: get,
	});
};
