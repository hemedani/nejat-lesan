import { type ActFn, ObjectId } from "@deps";
import { coreApp, goods_request, inventory, unit } from "../../../mod.ts";
import { getScopedUnitIds, type MyContext } from "@lib";

/**
 * اسکن نقطه سفارش مجدد (JIT): همه موجودی‌هایی که quantity <= min_quantity
 * (و min_quantity > 0) و درخواست باز (pending/approved/issued) ندارند →
 * ساخت goods_request با requested = max_quantity - quantity (replenish-to-ceiling)
 * و priority وقتی quantity <= min_quantity * 0.5.
 */
export const checkReorderFn: ActFn = async (body) => {
	const {
		set: { unitId, organizationId },
		get,
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const match: Record<string, any> = {
		min_quantity: { $gt: 0 },
		$expr: { $lte: ["$quantity", "$min_quantity"] },
	};

	// --- Scope ---
	let scopedUnitIds: ObjectId[] | null = null;
	if (unitId) {
		match["unit._id"] = new ObjectId(unitId as string);
	} else {
		scopedUnitIds = await getScopedUnitIds(user);
		if (scopedUnitIds) {
			if (scopedUnitIds.length === 0) return { created: 0, skipped: 0, rows: [] };
			match["unit._id"] = { $in: scopedUnitIds };
		}
	}
	if (organizationId && !match["unit._id"]) {
		const orgUnits = await unit
			.find({
				filters: { "organization._id": new ObjectId(organizationId as string) },
				projection: { _id: 1 },
			})
			.toArray();
		const ids = orgUnits.map((u) => u._id);
		if (ids.length === 0) return { created: 0, skipped: 0, rows: [] };
		match["unit._id"] = { $in: ids };
	}

	const inventories = await inventory
		.find({
			filters: match,
			projection: {
				_id: 1,
				quantity: 1,
				min_quantity: 1,
				max_quantity: 1,
				"unit._id": 1,
				"ware._id": 1,
			},
		})
		.toArray();

	const rows: Array<Record<string, unknown>> = [];
	let skipped = 0;

	for (const inv of inventories) {
		const doc = inv as any;
		const current = (doc.quantity as number) || 0;
		const minQ = doc.min_quantity as number;
		const maxQ = doc.max_quantity as number;
		const unitObjectId = doc.unit?._id as ObjectId | undefined;
		const wareObjectId = doc.ware?._id as ObjectId | undefined;
		if (!unitObjectId || !wareObjectId) continue;

		// بازدارندگی: فقط یک درخواست باز به ازای (unit, ware)
		const openRequest = await goods_request.findOne({
			filters: {
				"unit._id": unitObjectId,
				"ware._id": wareObjectId,
				status: { $in: ["pending", "approved", "issued"] },
			},
			projection: { _id: 1 },
		});
		if (openRequest) {
			skipped++;
			continue;
		}

		const ceiling = maxQ || minQ * 2;
		const requested = Math.max(1, Math.ceil(ceiling - current));
		const priority = current <= minQ * 0.5;

		const [maxDoc] = await goods_request
			.aggregation({
				pipeline: [{ $sort: { serial: -1 } }, { $limit: 1 }],
				projection: { serial: 1 },
			})
			.toArray();
		const serial = ((maxDoc?.serial as number) ?? 0) + 1;
		const year = new Date().getFullYear();
		const requestNumber = `REQ-${year}-${String(serial).padStart(6, "0")}`;

		const created = await goods_request.insertOne({
			doc: {
				serial,
				request_number: requestNumber,
				status: "pending",
				quantity: requested,
				priority,
				origin: "auto",
				requested_at: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			relations: {
				unit: {
					_ids: unitObjectId,
					relatedRelations: { goods_requests: true },
				},
				ware: {
					_ids: wareObjectId,
					relatedRelations: { goods_requests: true },
				},
				requested_by: {
					_ids: user._id,
					relatedRelations: { requested_goods: true },
				},
			},
			projection: { _id: 1 },
		});

		rows.push({
			_id: created?._id,
			request_number: requestNumber,
			ware_id: wareObjectId.toString(),
			quantity: requested,
			priority,
		});
	}

	return {
		created: rows.length,
		skipped,
		...(get.rows === 1 ? { rows } : {}),
	};
};
