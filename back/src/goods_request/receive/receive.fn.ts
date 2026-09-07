import { type ActFn, ObjectId } from "@deps";
import { coreApp, goods_request } from "../../../mod.ts";
import { addStock, type MyContext, throwError } from "@lib";

/**
 * issued → received: ورود کالا به واحد مصرف‌کننده (unit) با تراکنش goods_receipt.
 */
export const receiveFn: ActFn = async (body) => {
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
			"ware._id": 1,
		},
	});
	if (!request) return throwError("درخواست یافت نشد");
	if ((request as any).status !== "issued") {
		return throwError("درخواست باید ابتدا صادر (issue) شده باشد");
	}

	const unitId = (request as any).unit?._id as ObjectId | undefined;
	const wareId = (request as any).ware?._id as ObjectId | undefined;
	const quantity = (request as any).quantity as number;

	if (unitId && wareId && quantity > 0) {
		await addStock(
			unitId.toString(),
			wareId.toString(),
			quantity,
			"goods_receipt",
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
			$set: { status: "received", received_at: now, updatedAt: now },
		},
		projection: get,
	});
};
