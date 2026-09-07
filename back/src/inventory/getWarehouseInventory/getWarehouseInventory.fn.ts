import { type ActFn, ObjectId } from "@deps";
import { consumption, coreApp, unit } from "../../../mod.ts";
import {
	getScopedUnitIds,
	getWarehouseDashboard,
	type MyContext,
	throwError,
} from "@lib";

/**
 * داشبورد موجودی انبار + وضعیت JIT:
 *  - `avg_daily_demand` از مصرف ۳۰ روز اخیر
 *  - `reorder_point` = avg_daily_demand × lead_time_days × 1.2 (یا min_quantity)
 *  - `status`: healthy | due | critical
 * رئیس انبار (Warehouse head) کل سازمان را می‌بیند (warehouse bypass).
 */
export const getWarehouseInventoryFn: ActFn = async (body) => {
	const {
		set: { unitId },
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const warehouse = await unit.findOne({
		filters: { _id: new ObjectId(unitId as string) },
		projection: { _id: 1, type: 1 },
	});
	if (!warehouse) return throwError("واحد انبار یافت نشد");

	const scoped = await getScopedUnitIds(user);
	if (scoped && scoped.length === 0) {
		return { rows: [] };
	}

	const rows = (await getWarehouseDashboard(unitId as string)) as any[];

	// میانگین مصرف روزانه هر کالا از ۳۰ روز اخیر
	const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	const demandRows = await consumption
		.aggregation({
			pipeline: [
				{ $match: { consumed_at: { $gte: since } } },
				{ $group: { _id: "$ware._id", total: { $sum: "$quantity" } } },
			],
		})
		.toArray();
	const demandByWare = new Map<string, number>();
	for (const r of demandRows as any[]) {
		if (r._id) demandByWare.set(r._id.toString(), (r.total as number) / 30);
	}

	for (const row of rows) {
		const quantity = (row.quantity as number) || 0;
		const minQ = row.min_quantity as number | undefined;
		const avgDaily = row.ware?._id
			? (demandByWare.get(row.ware._id.toString()) ?? 0)
			: 0;
		const leadTime = (row.ware?.lead_time_days as number | undefined) ?? 1;
		row.avg_daily_demand = Math.round(avgDaily * 100) / 100;
		row.reorder_point = avgDaily > 0
			? Math.ceil(avgDaily * leadTime * 1.2)
			: (minQ ?? 0);
		if (minQ === undefined || minQ === null || minQ <= 0) {
			row.status = "healthy";
		} else if (quantity <= minQ * 0.5) {
			row.status = "critical";
		} else if (quantity <= minQ) {
			row.status = "due";
		} else {
			row.status = "healthy";
		}
	}

	return { rows };
};
