import { type ActFn, ObjectId } from "@deps";
import { coreApp, inventory, unit } from "../../../mod.ts";
import { adjustStock, getScopedUnitIds, type MyContext, throwError } from "@lib";

export const adjustFn: ActFn = async (body) => {
	const {
		set: { unitId, wareId, quantity, reason },
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

	const movementReason = reason || "adjustment";

	await adjustStock(
		unitId as string,
		wareId as string,
		quantity as number,
		movementReason,
		user._id.toString(),
		{ referenceType: "inventory.adjust" },
	);

	return await inventory.findOne({
		filters: {
			"unit._id": new ObjectId(unitId as string),
			"ware._id": new ObjectId(wareId as string),
		},
		projection: get,
	});
};
