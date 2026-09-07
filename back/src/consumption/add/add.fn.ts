import { type ActFn, ObjectId } from "@deps";
import { consumption, coreApp, inventory, ware } from "../../../mod.ts";
import { getScopedUnitIds, removeStock, type MyContext, throwError } from "@lib";

/**
 * ثبت مصرف → removeStock (کاهش موجودی + تراکنش) + ثبت سند مصرف.
 * واحد مصرف به‌صورت خودکار از scope نقش کاربر استنباط می‌شود (در صورت تعدد،
 * unitId الزامی است).
 */
export const addFn: ActFn = async (body) => {
	const {
		set: { wareId, quantity, unitId, reason, consumed_for, notes, consumed_at },
		get,
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const wareDoc = await ware.findOne({
		filters: { _id: new ObjectId(wareId as string) },
		projection: { _id: 1, name: 1 },
	});
	if (!wareDoc) return throwError("کالای مورد نظر یافت نشد");

	const scoped = await getScopedUnitIds(user);
	let resolvedUnitId = unitId as string | undefined;

	if (scoped) {
		if (!resolvedUnitId) {
			if (scoped.length === 1) {
				resolvedUnitId = scoped[0].toString();
			} else {
				return throwError("واحد مصرف (unitId) الزامی است");
			}
		} else if (!scoped.some((id) => id.toString() === resolvedUnitId)) {
			return throwError("شما به این واحد دسترسی ندارید");
		}
	} else if (!resolvedUnitId) {
		return throwError("واحد مصرف (unitId) الزامی است");
	}

	await removeStock(
		resolvedUnitId as string,
		wareId as string,
		quantity as number,
		"consumption",
		user._id.toString(),
		{
			referenceType: "consumption",
			description: reason as string,
		},
	);

	const inventoryDoc = await inventory.findOne({
		filters: {
			"unit._id": new ObjectId(resolvedUnitId as string),
			"ware._id": new ObjectId(wareId as string),
		},
		projection: { _id: 1 },
	});

	return await consumption.insertOne({
		doc: {
			quantity,
			consumed_at: consumed_at ? new Date(consumed_at as string) : new Date(),
			...(reason && { reason }),
			...(consumed_for && { consumed_for }),
			...(notes && { notes }),
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			unit: {
				_ids: new ObjectId(resolvedUnitId as string),
				relatedRelations: { consumptions: true },
			},
			consumed_by: {
				_ids: user._id,
				relatedRelations: { consumptions: true },
			},
			ware: {
				_ids: new ObjectId(wareId as string),
				relatedRelations: { consumptions: true },
			},
			...(inventoryDoc?._id && {
				inventory: {
					_ids: inventoryDoc._id,
					relatedRelations: { consumptions: true },
				},
			}),
		},
		projection: get,
	});
};
