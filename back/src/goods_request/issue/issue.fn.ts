import { type ActFn, ObjectId } from "@deps";
import { coreApp, goods_request } from "../../../mod.ts";
import { removeStock, type MyContext, throwError } from "@lib";

/**
 * approved → issued: خروج کالا از انبار (warehouse_unit) با تراکنش goods_issue.
 */
export const issueFn: ActFn = async (body) => {
	const {
		set: { _id },
		get,
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const request = await goods_request.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: {
			_id: 1,
			status: 1,
			quantity: 1,
			"unit._id": 1,
			"warehouse_unit._id": 1,
			"ware._id": 1,
		},
	});
	if (!request) return throwError("درخواست یافت نشد");
	if ((request as any).status !== "approved") {
		return throwError("درخواست باید ابتدا تأیید شود");
	}

	const warehouseId = (request as any).warehouse_unit?._id as
		| ObjectId
		| undefined;
	const wareId = (request as any).ware?._id as ObjectId | undefined;
	const quantity = (request as any).quantity as number;

	if (warehouseId && wareId && quantity > 0) {
		await removeStock(
			warehouseId.toString(),
			wareId.toString(),
			quantity,
			"goods_issue",
			user._id.toString(),
			{
				referenceType: "goodsRequest",
				referenceId: request._id.toString(),
			},
		);
	}

	const now = new Date();
	return await goods_request.findOneAndUpdate({
		filter: { _id: request._id as ObjectId },
		update: {
			$set: { status: "issued", issued_at: now, updatedAt: now },
		},
		projection: get,
	});
};
