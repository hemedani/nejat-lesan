import { type ActFn, ObjectId } from "@deps";
import { coreApp, goods_request, unit, ware } from "../../../mod.ts";
import { getScopedUnitIds, type MyContext, throwError } from "@lib";

/**
 * ثبت درخواست تأمین JIT (وضعیت pending). منشأ می‌تواند دستی یا scan خودکار باشد.
 */
export const addFn: ActFn = async (body) => {
	const {
		set: { unitId, wareId, quantity, warehouseUnitId, priority, notes, origin },
		get,
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const scoped = await getScopedUnitIds(user);
	if (scoped && !scoped.some((id) => id.toString() === (unitId as string))) {
		return throwError("شما به این واحد دسترسی ندارید");
	}

	const unitDoc = await unit.findOne({
		filters: { _id: new ObjectId(unitId as string) },
		projection: { _id: 1 },
	});
	if (!unitDoc) return throwError("واحد مورد نظر یافت نشد");
	const wareDoc = await ware.findOne({
		filters: { _id: new ObjectId(wareId as string) },
		projection: { _id: 1 },
	});
	if (!wareDoc) return throwError("کالای مورد نظر یافت نشد");

	if ((quantity as number) <= 0) {
		return throwError("مقدار درخواست باید بزرگ‌تر از صفر باشد");
	}

	const [maxDoc] = await goods_request
		.aggregation({
			pipeline: [{ $sort: { serial: -1 } }, { $limit: 1 }],
			projection: { serial: 1 },
		})
		.toArray();
	const serial = ((maxDoc?.serial as number) ?? 0) + 1;
	const year = new Date().getFullYear();
	const requestNumber = `REQ-${year}-${String(serial).padStart(6, "0")}`;

	return await goods_request.insertOne({
		doc: {
			serial,
			request_number: requestNumber,
			status: "pending",
			quantity,
			priority: priority ?? false,
			origin: origin ?? "manual",
			requested_at: new Date(),
			...(notes && { notes }),
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			unit: {
				_ids: new ObjectId(unitId as string),
				relatedRelations: { goods_requests: true },
			},
			ware: {
				_ids: new ObjectId(wareId as string),
				relatedRelations: { goods_requests: true },
			},
			requested_by: {
				_ids: user._id,
				relatedRelations: { requested_goods: true },
			},
			...(warehouseUnitId && {
				warehouse_unit: {
					_ids: new ObjectId(warehouseUnitId as string),
					relatedRelations: { warehouse_requests: true },
				},
			}),
		},
		projection: get,
	});
};
