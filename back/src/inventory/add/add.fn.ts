import { type ActFn, ObjectId } from "@deps";
import { coreApp, inventory, unit, ware } from "../../../mod.ts";
import { addStock, adjustStock, getScopedUnitIds, type MyContext, throwError } from "@lib";

/**
 * upsert موجودی برای (unit, ware). تغییر مقدار → تراکنش adjustment ثبت می‌شود.
 * فقط کاربر مجاز برای آن واحد می‌تواند موجودی را تغییر دهد.
 */
export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const {
		unitId,
		wareId,
		quantity = 0,
		min_quantity,
		max_quantity,
		batch_no,
		expiration_date,
		location,
		warehouseUnitId,
	} = set;

	// --- Scope check ---
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

	const expirationDate = expiration_date
		? new Date(expiration_date as string)
		: undefined;

	const existing = await inventory.findOne({
		filters: {
			"unit._id": new ObjectId(unitId as string),
			"ware._id": new ObjectId(wareId as string),
		},
		projection: { _id: 1, quantity: 1 },
	});

	if (existing) {
		await adjustStock(
			unitId as string,
			wareId as string,
			quantity as number,
			"adjustment",
			user._id.toString(),
			{
				batchNo: batch_no as string,
				expirationDate,
				location: location as string,
				referenceType: "inventory.add",
			},
		);
		await inventory.findOneAndUpdate({
			filter: { _id: existing._id as ObjectId },
			update: {
				$set: {
					...(min_quantity !== undefined && { min_quantity }),
					...(max_quantity !== undefined && { max_quantity }),
					updatedAt: new Date(),
				},
			},
			projection: { _id: 1 },
		});
	} else {
		await addStock(
			unitId as string,
			wareId as string,
			quantity as number,
			"adjustment",
			user._id.toString(),
			{
				batchNo: batch_no as string,
				expirationDate,
				location: location as string,
				warehouseUnitId: warehouseUnitId as string,
				referenceType: "inventory.add",
			},
		);
		if (min_quantity !== undefined || max_quantity !== undefined) {
			await inventory.findOneAndUpdate({
				filter: {
					"unit._id": new ObjectId(unitId as string),
					"ware._id": new ObjectId(wareId as string),
				},
				update: {
					$set: {
						...(min_quantity !== undefined && { min_quantity }),
						...(max_quantity !== undefined && { max_quantity }),
						updatedAt: new Date(),
					},
				},
				projection: { _id: 1 },
			});
		}
	}

	return await inventory.findOne({
		filters: {
			"unit._id": new ObjectId(unitId as string),
			"ware._id": new ObjectId(wareId as string),
		},
		projection: get,
	});
};
