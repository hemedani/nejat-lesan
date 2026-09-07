import { type Document, ObjectId } from "@deps";
import { inventory, stock_movement } from "../mod.ts";
import { throwError } from "./throwError.ts";

/**
 * inventoryManager — تنها مسیر نوشتن در inventory و stock_movement.
 * هر فراخوانی به‌صورت اتمیک: upsert موجودی + ثبت تراکنش stock_movement با
 * مانده قبل/بعد. هیچ اکشن کاربری نباید مستقیم به این دو مدل بنویسد.
 *
 * Field naming: snake_case (قرارداد این ریپو).
 */
export type StockOptions = {
	wareName?: string;
	referenceType?: string;
	referenceId?: string;
	description?: string;
	batchNo?: string;
	expirationDate?: Date;
	warehouseUnitId?: string;
	location?: string;
	inventoryId?: string;
};

const writeStockMovement = async (
	unitId: string,
	wareId: string,
	quantity: number,
	balanceBefore: number,
	balanceAfter: number,
	reason: string,
	createdByUserId: string,
	options?: StockOptions,
) => {
	await stock_movement.insertOne({
		doc: {
			quantity,
			balance_before: balanceBefore,
			balance_after: balanceAfter,
			reason,
			...(options?.referenceType && { reference_type: options.referenceType }),
			...(options?.referenceId && { reference_id: options.referenceId }),
			...(options?.description && { description: options.description }),
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			unit: {
				_ids: new ObjectId(unitId),
				relatedRelations: { stock_movements: true },
			},
			created_by: {
				_ids: new ObjectId(createdByUserId),
				relatedRelations: { created_stock_movements: true },
			},
			ware: {
				_ids: new ObjectId(wareId),
				relatedRelations: { stock_movements: true },
			},
		},
		projection: { _id: 1 },
	});
};

export const addStock = async (
	unitId: string,
	wareId: string,
	quantity: number,
	reason: string,
	createdByUserId: string,
	options?: StockOptions,
): Promise<Document> => {
	const existing = await inventory.findOne({
		filters: {
			"unit._id": new ObjectId(unitId),
			"ware._id": new ObjectId(wareId),
		},
		projection: { _id: 1, quantity: 1 },
	}) as Document | null;

	let balanceBefore = 0;

	if (existing) {
		balanceBefore = (existing.quantity as number) || 0;
		await inventory.findOneAndUpdate({
			filter: { _id: existing._id as ObjectId },
			update: {
				$inc: { quantity },
				$set: { updatedAt: new Date() },
			},
			projection: { _id: 1 },
		});
	} else {
		const relations: Record<string, any> = {
			unit: {
				_ids: new ObjectId(unitId),
				relatedRelations: { inventories: true },
			},
			ware: {
				_ids: new ObjectId(wareId),
				relatedRelations: { inventories: true },
			},
		};
		if (options?.warehouseUnitId) {
			relations.warehouse_unit = {
				_ids: new ObjectId(options.warehouseUnitId),
				relatedRelations: { warehouseInventories: true },
			};
		}
		await inventory.insertOne({
			doc: {
				quantity,
				...(options?.batchNo && { batch_no: options.batchNo }),
				...(options?.expirationDate && { expiration_date: options.expirationDate }),
				...(options?.location && { location: options.location }),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			relations,
			projection: { _id: 1 },
		});
	}

	const balanceAfter = balanceBefore + quantity;

	await writeStockMovement(
		unitId,
		wareId,
		quantity,
		balanceBefore,
		balanceAfter,
		reason,
		createdByUserId,
		options,
	);

	return { success: true, wareId, balanceBefore, balanceAfter };
};

export const removeStock = async (
	unitId: string,
	wareId: string,
	quantity: number,
	reason: string,
	createdByUserId: string,
	options?: StockOptions,
): Promise<Document> => {
	const existing = await inventory.findOne({
		filters: {
			...(options?.inventoryId
				? { _id: new ObjectId(options.inventoryId) }
				: {
					"unit._id": new ObjectId(unitId),
					"ware._id": new ObjectId(wareId),
				}),
		},
		projection: { _id: 1, quantity: 1 },
	}) as Document | null;

	if (!existing) {
		return throwError("موجودی برای این واحد و کالا یافت نشد");
	}

	const balanceBefore = (existing.quantity as number) || 0;
	if (balanceBefore < quantity) {
		return throwError(
			`موجودی کافی نیست (موجودی ${balanceBefore}، درخواستی ${quantity})`,
		);
	}

	const negQuantity = -Math.abs(quantity);

	await inventory.findOneAndUpdate({
		filter: { _id: existing._id as ObjectId },
		update: {
			$inc: { quantity: negQuantity },
			$set: { updatedAt: new Date() },
		},
		projection: { _id: 1 },
	});

	const balanceAfter = balanceBefore - quantity;

	await writeStockMovement(
		unitId,
		wareId,
		negQuantity,
		balanceBefore,
		balanceAfter,
		reason,
		createdByUserId,
		options,
	);

	return { success: true, wareId, balanceBefore, balanceAfter };
};

export const transferStock = async (
	fromUnitId: string,
	toUnitId: string,
	wareId: string,
	quantity: number,
	createdByUserId: string,
	options?: StockOptions,
): Promise<Document> => {
	await removeStock(fromUnitId, wareId, quantity, "transfer_out", createdByUserId, {
		...options,
		referenceType: options?.referenceType || "unit",
		referenceId: options?.referenceId || toUnitId,
		description: options?.description || `انتقال به واحد ${toUnitId}`,
	});

	await addStock(toUnitId, wareId, quantity, "transfer_in", createdByUserId, {
		...options,
		referenceType: options?.referenceType || "unit",
		referenceId: options?.referenceId || fromUnitId,
		description: options?.description || `انتقال از واحد ${fromUnitId}`,
	});

	return { success: true, wareId, quantity, fromUnitId: fromUnitId, toUnitId: toUnitId };
};

export const adjustStock = async (
	unitId: string,
	wareId: string,
	newQuantity: number,
	reason: string,
	createdByUserId: string,
	options?: StockOptions,
): Promise<Document> => {
	const existing = await inventory.findOne({
		filters: {
			"unit._id": new ObjectId(unitId),
			"ware._id": new ObjectId(wareId),
		},
		projection: { _id: 1, quantity: 1 },
	}) as Document | null;

	if (!existing) {
		return throwError("موجودی برای این واحد و کالا یافت نشد");
	}

	const balanceBefore = (existing.quantity as number) || 0;
	const delta = newQuantity - balanceBefore;

	await inventory.findOneAndUpdate({
		filter: { _id: existing._id as ObjectId },
		update: {
			$set: { quantity: newQuantity, updatedAt: new Date() },
		},
		projection: { _id: 1 },
	});

	await writeStockMovement(
		unitId,
		wareId,
		delta,
		balanceBefore,
		newQuantity,
		reason,
		createdByUserId,
		options,
	);

	return { success: true, wareId, balanceBefore, balanceAfter: newQuantity };
};

export const getStockLevel = async (
	unitId: string,
	wareId: string,
): Promise<Document> => {
	const result = await inventory.findOne({
		filters: {
			"unit._id": new ObjectId(unitId),
			"ware._id": new ObjectId(wareId),
		},
		projection: {
			_id: 1,
			quantity: 1,
			min_quantity: 1,
			max_quantity: 1,
			batch_no: 1,
			expiration_date: 1,
			location: 1,
			unit: 1,
			ware: 1,
		},
	});
	return result || { quantity: 0 };
};

export const getWarehouseDashboard = async (
	warehouseUnitId: string,
): Promise<Document[]> => {
	const match: Document = {
		$or: [
			{ "unit._id": new ObjectId(warehouseUnitId) },
			{ "warehouse_unit._id": new ObjectId(warehouseUnitId) },
		],
	};

	return await inventory
		.aggregation({
			pipeline: [
				{ $match: match },
				{ $sort: { "ware.name": 1 } },
			],
			projection: {
				_id: 1,
				quantity: 1,
				min_quantity: 1,
				max_quantity: 1,
				location: 1,
				unit: { _id: 1, name: 1, type: 1 },
				ware: { _id: 1, name: 1, price: 1, ware_type: 1 },
			},
		})
		.toArray();
};
