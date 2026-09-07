import { type ActFn, ObjectId } from "@deps";
import { coreApp, goods_receipt, unit } from "../../../mod.ts";
import { addStock, type MyContext, throwError } from "@lib";

/**
 * رسید کالا → addStock برای هر قلم پذیرفته‌شده + شماره خودکار `GR-{year}-{serial}`.
 * رفتار cross-dock در فاز ۵ (JIT) اضافه می‌شود؛ در حال حاضر کالا به receiving_unit می‌رود.
 */
export const addFn: ActFn = async (body) => {
	const {
		set: { receivingUnitId, received_at, notes, items, cross_dock, targetUnitId },
		get,
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const unitDoc = await unit.findOne({
		filters: { _id: new ObjectId(receivingUnitId as string) },
		projection: { _id: 1, name: 1 },
	});
	if (!unitDoc) return throwError("واحد دریافت‌کننده یافت نشد");

	// JIT cross-dock: کالای پذیرفته‌شده مستقیم به واحد هدف صادر می‌شود.
	const crossDock = cross_dock === true;
	let targetDoc: { _id: ObjectId } | null = null;
	if (crossDock) {
		if (!targetUnitId) return throwError("در cross-dock واحد هدف الزامی است");
		targetDoc = await unit.findOne({
			filters: { _id: new ObjectId(targetUnitId as string) },
			projection: { _id: 1 },
		});
		if (!targetDoc) return throwError("واحد هدف یافت نشد");
	}

	const [maxDoc] = await goods_receipt
		.aggregation({
			pipeline: [{ $sort: { serial: -1 } }, { $limit: 1 }],
			projection: { serial: 1 },
		})
		.toArray();
	const serial = ((maxDoc?.serial as number) ?? 0) + 1;
	const year = new Date().getFullYear();
	const receiptNumber = `GR-${year}-${String(serial).padStart(6, "0")}`;

	for (const item of items) {
		if (item.ware_id && (item.quantity_accepted ?? 0) > 0) {
			// cross-dock → تراکنش goods_issue روی واحد هدف؛ در غیر این صورت goods_receipt
			const stockReason = crossDock ? "goods_issue" : "goods_receipt";
			const stockUnitId = crossDock && targetDoc
				? targetUnitId as string
				: receivingUnitId as string;
			await addStock(
				stockUnitId,
				item.ware_id,
				item.quantity_accepted,
				stockReason,
				user._id.toString(),
				{
					batchNo: item.batch_no as string,
					expirationDate: item.expiration_date
						? new Date(item.expiration_date as string)
						: undefined,
					referenceType: "goodsReceipt",
				},
			);
		}
	}

	const hasRejected = items.some((i: any) => (i.quantity_rejected ?? 0) > 0);
	const hasAccepted = items.some((i: any) => (i.quantity_accepted ?? 0) > 0);
	const status = hasAccepted && hasRejected
		? "partially_rejected"
		: hasAccepted
		? "completed"
		: "pending";

	return await goods_receipt.insertOne({
		doc: {
			serial,
			receipt_number: receiptNumber,
			received_at: received_at ? new Date(received_at as string) : new Date(),
			status,
			...(notes && { notes }),
			items,
			cross_dock: crossDock,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			received_by: {
				_ids: user._id,
				relatedRelations: { received_goods: true },
			},
			receiving_unit: {
				_ids: new ObjectId(receivingUnitId as string),
				relatedRelations: { goods_receipts: true },
			},
			...(crossDock && targetUnitId && {
				target_unit: {
					_ids: new ObjectId(targetUnitId as string),
					relatedRelations: { cross_dock_receipts: true },
				},
			}),
		},
		projection: get,
	});
};
